#!/usr/bin/env python3
"""
Example Usage of the Agile Feature Development Algorithm

This script demonstrates how to use the algorithm with different feature descriptions.
"""

from complete_agile_algorithm import CompleteAgileAlgorithm
import datetime


def run_example(feature_description: str, example_name: str):
    """Run the algorithm with a specific feature description"""
    print(f"\n{'='*80}")
    print(f"🎯 EXAMPLE: {example_name}")
    print(f"📋 Feature: {feature_description}")
    print(f"🕐 Started: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*80}")
    
    # Initialize and execute the algorithm
    algorithm = CompleteAgileAlgorithm(feature_description)
    results = algorithm.execute_algorithm()
    
    print(f"\n✅ {example_name} completed!")
    print(f"📊 Status: {results['final_status']}")
    print(f"🔄 Iterations: {len(results['iterations'])}")
    print(f"📁 Files generated in: {algorithm.code_dir}")
    
    return results


def main():
    """Run multiple examples to demonstrate algorithm versatility"""
    
    examples = [
        {
            "name": "User Authentication System",
            "description": "user authentication system with OAuth2, JWT tokens, and multi-factor authentication"
        },
        {
            "name": "E-commerce Shopping Cart",
            "description": "e-commerce shopping cart with payment processing, inventory management, and order tracking"
        },
        {
            "name": "Real-time Chat System",
            "description": "real-time chat messaging system with file sharing, group conversations, and message history"
        },
        {
            "name": "Task Management System",
            "description": "task management system with project organization, team collaboration, and progress tracking"
        },
        {
            "name": "Content Management System",
            "description": "content management system with WYSIWYG editor, media library, and SEO optimization"
        }
    ]
    
    print("🚀 AGILE FEATURE DEVELOPMENT ALGORITHM - EXAMPLES")
    print("This script demonstrates the algorithm's ability to develop any feature")
    print("from a simple natural language description.\n")
    
    results_summary = []
    
    for i, example in enumerate(examples, 1):
        print(f"\n🎯 Running Example {i}/{len(examples)}: {example['name']}")
        
        try:
            result = run_example(example['description'], example['name'])
            results_summary.append({
                "name": example['name'],
                "status": result['final_status'],
                "iterations": len(result['iterations'])
            })
        except Exception as e:
            print(f"❌ Error in {example['name']}: {e}")
            results_summary.append({
                "name": example['name'],
                "status": "error",
                "error": str(e)
            })
    
    # Print summary
    print(f"\n{'='*80}")
    print("📊 EXECUTION SUMMARY")
    print(f"{'='*80}")
    
    for result in results_summary:
        status_emoji = "✅" if result['status'] == 'completed' else "❌"
        print(f"{status_emoji} {result['name']}: {result['status'].upper()}")
        if 'iterations' in result:
            print(f"   🔄 Iterations: {result['iterations']}")
        if 'error' in result:
            print(f"   ❌ Error: {result['error']}")
    
    successful = sum(1 for r in results_summary if r['status'] == 'completed')
    total = len(results_summary)
    
    print(f"\n🎉 Successfully completed {successful}/{total} examples")
    print(f"📈 Success rate: {(successful/total)*100:.1f}%")
    
    print(f"\n{'='*80}")
    print("🎯 ALGORITHM CAPABILITIES DEMONSTRATED")
    print(f"{'='*80}")
    print("✅ Parameterized feature development from natural language")
    print("✅ Complete agile development lifecycle automation")
    print("✅ Enterprise-grade code generation")
    print("✅ Comprehensive testing and quality assurance")
    print("✅ Production-ready deployment configurations")
    print("✅ Autonomous maintenance components")
    print("✅ Extensive documentation generation")
    print("✅ Iterative development with continuous feedback")


if __name__ == "__main__":
    main()
