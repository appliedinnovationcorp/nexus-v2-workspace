"""
Enhanced Saga Orchestrator - Core orchestration engine
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Set
from uuid import uuid4
import json

from core.models import (
    SagaDefinition, SagaInstance, SagaStepInstance, SagaEvent,
    SagaStatus, StepStatus, EventType, Priority
)
from core.config import Settings
from services.event_store import EventStore
from services.state_manager import StateManager
from services.step_executor import StepExecutor
from services.compensation_manager import CompensationManager
from services.notification_service import NotificationService
from utils.metrics import MetricsCollector
from utils.circuit_breaker import CircuitBreaker
from utils.retry import RetryManager

logger = logging.getLogger(__name__)

class SagaOrchestrator:
    """Enhanced Saga Orchestrator with enterprise features"""
    
    def __init__(
        self,
        event_store: EventStore,
        state_manager: StateManager,
        settings: Settings
    ):
        self.event_store = event_store
        self.state_manager = state_manager
        self.settings = settings
        
        # Core components
        self.step_executor = StepExecutor(settings)
        self.compensation_manager = CompensationManager(settings)
        self.notification_service = NotificationService(settings)
        self.metrics = MetricsCollector()
        self.retry_manager = RetryManager(settings)
        
        # Runtime state
        self.active_sagas: Dict[str, SagaInstance] = {}
        self.saga_definitions: Dict[str, SagaDefinition] = {}
        self.running = False
        self.worker_tasks: List[asyncio.Task] = []
        
        # Circuit breakers for external services
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        
        # Concurrency control
        self.semaphore = asyncio.Semaphore(settings.max_concurrent_sagas)
        
    async def start(self):
        """Start the orchestrator"""
        logger.info("🚀 Starting Enhanced Saga Orchestrator")
        
        try:
            # Initialize components
            await self.event_store.initialize()
            await self.state_manager.initialize()
            await self.step_executor.initialize()
            await self.compensation_manager.initialize()
            await self.notification_service.initialize()
            
            # Load saga definitions
            await self._load_saga_definitions()
            
            # Recover active sagas
            await self._recover_active_sagas()
            
            # Start worker tasks
            self.running = True
            self._start_workers()
            
            logger.info("✅ Saga Orchestrator started successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to start orchestrator: {e}")
            raise
    
    async def stop(self):
        """Stop the orchestrator"""
        logger.info("🛑 Stopping Saga Orchestrator")
        
        self.running = False
        
        # Cancel worker tasks
        for task in self.worker_tasks:
            task.cancel()
        
        # Wait for tasks to complete
        if self.worker_tasks:
            await asyncio.gather(*self.worker_tasks, return_exceptions=True)
        
        # Stop components
        await self.step_executor.stop()
        await self.compensation_manager.stop()
        await self.notification_service.stop()
        await self.state_manager.stop()
        await self.event_store.stop()
        
        logger.info("✅ Saga Orchestrator stopped")
    
    def _start_workers(self):
        """Start background worker tasks"""
        # Main orchestration worker
        self.worker_tasks.append(
            asyncio.create_task(self._orchestration_worker())
        )
        
        # Event processing worker
        self.worker_tasks.append(
            asyncio.create_task(self._event_processing_worker())
        )
        
        # Timeout monitoring worker
        self.worker_tasks.append(
            asyncio.create_task(self._timeout_monitoring_worker())
        )
        
        # Cleanup worker
        self.worker_tasks.append(
            asyncio.create_task(self._cleanup_worker())
        )
        
        # Metrics collection worker
        self.worker_tasks.append(
            asyncio.create_task(self._metrics_worker())
        )
    
    async def create_saga(
        self,
        saga_name: str,
        context: Dict[str, Any],
        saga_version: Optional[str] = None,
        priority: Priority = Priority.NORMAL,
        correlation_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        tags: List[str] = None,
        metadata: Dict[str, Any] = None
    ) -> str:
        """Create and start a new saga instance"""
        
        # Find saga definition
        saga_def = await self._get_saga_definition(saga_name, saga_version)
        if not saga_def:
            raise ValueError(f"Saga definition not found: {saga_name}")
        
        # Create saga instance
        saga_instance = SagaInstance(
            saga_id=saga_def.id,
            saga_version=saga_def.version,
            tenant_id=tenant_id,
            correlation_id=correlation_id or str(uuid4()),
            status=SagaStatus.PENDING,
            priority=priority,
            total_steps=len(saga_def.steps),
            context=context,
            tags=tags or [],
            metadata=metadata or {}
        )
        
        # Initialize step instances
        for step_def in saga_def.steps:
            step_instance = SagaStepInstance(
                step_id=step_def.id,
                saga_instance_id=saga_instance.id,
                status=StepStatus.PENDING
            )
            saga_instance.steps.append(step_instance)
        
        # Store saga instance
        await self.state_manager.save_saga_instance(saga_instance)
        
        # Add to active sagas
        self.active_sagas[saga_instance.id] = saga_instance
        
        # Publish saga started event
        await self._publish_event(
            saga_instance.id,
            EventType.SAGA_STARTED,
            {
                "saga_name": saga_name,
                "saga_version": saga_def.version,
                "context": context,
                "priority": priority.value
            }
        )
        
        # Start saga execution
        asyncio.create_task(self._execute_saga(saga_instance.id))
        
        logger.info(f"📝 Created saga: {saga_name} ({saga_instance.id})")
        self.metrics.increment_counter("sagas_created_total")
        
        return saga_instance.id
    
    async def _execute_saga(self, saga_id: str):
        """Execute a saga instance"""
        async with self.semaphore:  # Concurrency control
            try:
                saga_instance = self.active_sagas.get(saga_id)
                if not saga_instance:
                    logger.error(f"Saga instance not found: {saga_id}")
                    return
                
                saga_def = await self._get_saga_definition(
                    saga_instance.saga_id,
                    saga_instance.saga_version
                )
                
                if not saga_def:
                    logger.error(f"Saga definition not found: {saga_instance.saga_id}")
                    await self._fail_saga(saga_id, "Saga definition not found")
                    return
                
                # Update status to running
                saga_instance.status = SagaStatus.RUNNING
                saga_instance.started_at = datetime.now(timezone.utc)
                await self.state_manager.save_saga_instance(saga_instance)
                
                logger.info(f"🔄 Executing saga: {saga_def.name} ({saga_id})")
                
                # Execute steps
                success = await self._execute_steps(saga_instance, saga_def)
                
                if success:
                    await self._complete_saga(saga_id)
                else:
                    await self._fail_saga(saga_id, "Step execution failed")
                
            except Exception as e:
                logger.error(f"❌ Error executing saga {saga_id}: {e}", exc_info=True)
                await self._fail_saga(saga_id, str(e))
    
    async def _execute_steps(
        self,
        saga_instance: SagaInstance,
        saga_def: SagaDefinition
    ) -> bool:
        """Execute saga steps with support for parallel execution"""
        
        try:
            # Group steps by parallel execution groups
            step_groups = self._group_steps_for_execution(saga_def.steps)
            
            for group in step_groups:
                if saga_instance.status != SagaStatus.RUNNING:
                    return False
                
                # Execute steps in parallel within the group
                if len(group) == 1:
                    # Single step execution
                    success = await self._execute_step(saga_instance, group[0])
                    if not success:
                        return False
                else:
                    # Parallel step execution
                    tasks = [
                        self._execute_step(saga_instance, step_def)
                        for step_def in group
                    ]
                    results = await asyncio.gather(*tasks, return_exceptions=True)
                    
                    # Check if all steps succeeded
                    for result in results:
                        if isinstance(result, Exception) or not result:
                            return False
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error executing steps for saga {saga_instance.id}: {e}")
            return False
    
    async def _execute_step(
        self,
        saga_instance: SagaInstance,
        step_def: Any
    ) -> bool:
        """Execute a single saga step"""
        
        # Find step instance
        step_instance = next(
            (s for s in saga_instance.steps if s.step_id == step_def.id),
            None
        )
        
        if not step_instance:
            logger.error(f"Step instance not found: {step_def.id}")
            return False
        
        try:
            # Check conditions
            if not await self._check_step_conditions(step_def, saga_instance.context):
                step_instance.status = StepStatus.SKIPPED
                await self.state_manager.save_saga_instance(saga_instance)
                return True
            
            # Update step status
            step_instance.status = StepStatus.RUNNING
            step_instance.started_at = datetime.now(timezone.utc)
            await self.state_manager.save_saga_instance(saga_instance)
            
            # Publish step started event
            await self._publish_event(
                saga_instance.id,
                EventType.STEP_STARTED,
                {
                    "step_id": step_def.id,
                    "step_name": step_def.name,
                    "service": step_def.service
                },
                step_instance.id
            )
            
            logger.info(f"🔄 Executing step: {step_def.name} ({saga_instance.id})")
            
            # Execute step with retry logic
            success = await self.retry_manager.execute_with_retry(
                self._execute_step_action,
                saga_instance,
                step_def,
                step_instance,
                max_retries=step_def.retries,
                delay=step_def.retry_delay
            )
            
            if success:
                # Step completed successfully
                step_instance.status = StepStatus.COMPLETED
                step_instance.completed_at = datetime.now(timezone.utc)
                step_instance.duration_ms = int(
                    (step_instance.completed_at - step_instance.started_at).total_seconds() * 1000
                )
                
                await self.state_manager.save_saga_instance(saga_instance)
                
                # Publish step completed event
                await self._publish_event(
                    saga_instance.id,
                    EventType.STEP_COMPLETED,
                    {
                        "step_id": step_def.id,
                        "step_name": step_def.name,
                        "duration_ms": step_instance.duration_ms,
                        "output_data": step_instance.output_data
                    },
                    step_instance.id
                )
                
                logger.info(f"✅ Step completed: {step_def.name} ({saga_instance.id})")
                self.metrics.increment_counter("steps_completed_total")
                
                return True
            else:
                # Step failed
                step_instance.status = StepStatus.FAILED
                step_instance.completed_at = datetime.now(timezone.utc)
                await self.state_manager.save_saga_instance(saga_instance)
                
                # Publish step failed event
                await self._publish_event(
                    saga_instance.id,
                    EventType.STEP_FAILED,
                    {
                        "step_id": step_def.id,
                        "step_name": step_def.name,
                        "error_message": step_instance.error_message,
                        "retry_count": step_instance.retry_count
                    },
                    step_instance.id
                )
                
                logger.error(f"❌ Step failed: {step_def.name} ({saga_instance.id})")
                self.metrics.increment_counter("steps_failed_total")
                
                return False
                
        except Exception as e:
            logger.error(f"❌ Error executing step {step_def.name}: {e}", exc_info=True)
            step_instance.status = StepStatus.FAILED
            step_instance.error_message = str(e)
            step_instance.completed_at = datetime.now(timezone.utc)
            await self.state_manager.save_saga_instance(saga_instance)
            return False
    
    async def _execute_step_action(
        self,
        saga_instance: SagaInstance,
        step_def: Any,
        step_instance: SagaStepInstance
    ) -> bool:
        """Execute the actual step action"""
        
        # Get or create circuit breaker for the service
        circuit_breaker = self.circuit_breakers.get(step_def.service)
        if not circuit_breaker:
            circuit_breaker = CircuitBreaker(
                failure_threshold=5,
                recovery_timeout=30,
                expected_exception=Exception
            )
            self.circuit_breakers[step_def.service] = circuit_breaker
        
        # Execute step through circuit breaker
        try:
            result = await circuit_breaker.call(
                self.step_executor.execute_step,
                step_def,
                saga_instance.context,
                step_instance.input_data
            )
            
            # Update step instance with result
            step_instance.output_data = result.get("output_data", {})
            
            # Update saga context with step result
            if result.get("context_updates"):
                saga_instance.context.update(result["context_updates"])
            
            return result.get("success", False)
            
        except Exception as e:
            step_instance.error_message = str(e)
            step_instance.retry_count += 1
            raise
    
    async def _complete_saga(self, saga_id: str):
        """Complete a saga successfully"""
        saga_instance = self.active_sagas.get(saga_id)
        if not saga_instance:
            return
        
        saga_instance.status = SagaStatus.COMPLETED
        saga_instance.completed_at = datetime.now(timezone.utc)
        saga_instance.duration_ms = int(
            (saga_instance.completed_at - saga_instance.started_at).total_seconds() * 1000
        )
        
        await self.state_manager.save_saga_instance(saga_instance)
        
        # Publish saga completed event
        await self._publish_event(
            saga_id,
            EventType.SAGA_COMPLETED,
            {
                "duration_ms": saga_instance.duration_ms,
                "total_steps": saga_instance.total_steps,
                "context": saga_instance.context
            }
        )
        
        # Remove from active sagas
        del self.active_sagas[saga_id]
        
        # Send notification
        await self.notification_service.send_saga_completed(saga_instance)
        
        logger.info(f"✅ Saga completed: {saga_id}")
        self.metrics.increment_counter("sagas_completed_total")
    
    async def _fail_saga(self, saga_id: str, error_message: str):
        """Fail a saga and start compensation"""
        saga_instance = self.active_sagas.get(saga_id)
        if not saga_instance:
            return
        
        saga_instance.status = SagaStatus.FAILED
        saga_instance.error_message = error_message
        saga_instance.completed_at = datetime.now(timezone.utc)
        
        await self.state_manager.save_saga_instance(saga_instance)
        
        # Publish saga failed event
        await self._publish_event(
            saga_id,
            EventType.SAGA_FAILED,
            {
                "error_message": error_message,
                "failed_step": saga_instance.current_step
            }
        )
        
        # Start compensation
        await self._start_compensation(saga_id)
        
        logger.error(f"❌ Saga failed: {saga_id} - {error_message}")
        self.metrics.increment_counter("sagas_failed_total")
    
    async def _start_compensation(self, saga_id: str):
        """Start saga compensation process"""
        saga_instance = self.active_sagas.get(saga_id)
        if not saga_instance:
            return
        
        saga_instance.status = SagaStatus.COMPENSATING
        await self.state_manager.save_saga_instance(saga_instance)
        
        logger.info(f"🔄 Starting compensation for saga: {saga_id}")
        
        # Execute compensation
        success = await self.compensation_manager.compensate_saga(saga_instance)
        
        if success:
            saga_instance.status = SagaStatus.COMPENSATED
            await self._publish_event(saga_id, EventType.SAGA_COMPENSATED, {})
            logger.info(f"✅ Saga compensated: {saga_id}")
            self.metrics.increment_counter("sagas_compensated_total")
        else:
            logger.error(f"❌ Compensation failed for saga: {saga_id}")
        
        await self.state_manager.save_saga_instance(saga_instance)
        
        # Remove from active sagas
        if saga_id in self.active_sagas:
            del self.active_sagas[saga_id]
        
        # Send notification
        await self.notification_service.send_saga_compensated(saga_instance)
    
    # Additional helper methods would continue here...
    # (Due to length constraints, I'm showing the core structure)
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check"""
        return {
            "status": "healthy" if self.running else "stopped",
            "active_sagas": len(self.active_sagas),
            "saga_definitions": len(self.saga_definitions),
            "components": {
                "event_store": await self.event_store.health_check(),
                "state_manager": await self.state_manager.health_check(),
                "step_executor": await self.step_executor.health_check()
            }
        }
    
    async def is_ready(self) -> bool:
        """Check if orchestrator is ready"""
        return (
            self.running and
            await self.event_store.is_ready() and
            await self.state_manager.is_ready()
        )
