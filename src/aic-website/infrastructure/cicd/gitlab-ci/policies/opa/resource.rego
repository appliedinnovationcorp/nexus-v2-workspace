package gitlab.resource

# Default to deny
default allow = false

# Allow if all resource checks pass
allow {
    valid_resource_requests
    valid_job_timeouts
    valid_cache_configuration
    valid_artifact_configuration
    valid_service_configuration
}

# Check if resource requests are valid
valid_resource_requests {
    # Maximum allowed resource requests
    max_cpu := 4
    max_memory := 8192  # MB
    
    # Get all jobs with resource requests
    jobs_with_resources := [job | 
        job = input.pipeline.jobs[_]
        job.resource_group != null
    ]
    
    # If no jobs with resources, requests are valid
    count(jobs_with_resources) == 0
}

valid_resource_requests {
    # Maximum allowed resource requests
    max_cpu := 4
    max_memory := 8192  # MB
    
    # Get all jobs with resource requests
    jobs_with_resources := [job | 
        job = input.pipeline.jobs[_]
        job.resource_group != null
    ]
    
    # Check each job's resource requests
    job = jobs_with_resources[_]
    
    # Parse CPU request (assuming format like "500m" or "2")
    cpu_value := to_number(trim_suffix(job.resource_group.cpu, "m"))
    cpu_unit := contains(job.resource_group.cpu, "m")
    
    # Convert to cores (1000m = 1 core)
    cpu_cores := cpu_unit ? cpu_value / 1000 : cpu_value
    
    # Check if CPU request is within limits
    cpu_cores <= max_cpu
    
    # Parse memory request (assuming format like "500Mi" or "2Gi")
    memory_value := to_number(trim_suffix(trim_suffix(job.resource_group.memory, "Mi"), "Gi"))
    memory_unit := contains(job.resource_group.memory, "Gi")
    
    # Convert to MB (1Gi = 1024Mi)
    memory_mb := memory_unit ? memory_value * 1024 : memory_value
    
    # Check if memory request is within limits
    memory_mb <= max_memory
}

# Check if job timeouts are valid
valid_job_timeouts {
    # Maximum allowed timeout (in minutes)
    max_timeout := 60
    
    # Get all jobs with timeouts
    jobs_with_timeouts := [job | 
        job = input.pipeline.jobs[_]
        job.timeout != null
    ]
    
    # If no jobs with timeouts, timeouts are valid
    count(jobs_with_timeouts) == 0
}

valid_job_timeouts {
    # Maximum allowed timeout (in minutes)
    max_timeout := 60
    
    # Get all jobs with timeouts
    jobs_with_timeouts := [job | 
        job = input.pipeline.jobs[_]
        job.timeout != null
    ]
    
    # Check each job's timeout
    job = jobs_with_timeouts[_]
    
    # Parse timeout (assuming format like "30 minutes" or "1 hour")
    timeout_parts := split(job.timeout, " ")
    timeout_value := to_number(timeout_parts[0])
    timeout_unit := timeout_parts[1]
    
    # Convert to minutes
    timeout_minutes := timeout_unit == "hour" ? timeout_value * 60 : timeout_value
    
    # Check if timeout is within limits
    timeout_minutes <= max_timeout
}

# Check if cache configuration is valid
valid_cache_configuration {
    # Get all jobs with cache
    jobs_with_cache := [job | 
        job = input.pipeline.jobs[_]
        job.cache != null
    ]
    
    # If no jobs with cache, cache configuration is valid
    count(jobs_with_cache) == 0
}

valid_cache_configuration {
    # Get all jobs with cache
    jobs_with_cache := [job | 
        job = input.pipeline.jobs[_]
        job.cache != null
    ]
    
    # Check each job's cache configuration
    job = jobs_with_cache[_]
    
    # Check if cache has key and paths
    job.cache.key != null
    job.cache.paths != null
    
    # Check if cache paths are valid
    valid_cache_paths(job.cache.paths)
}

# Helper function to check if cache paths are valid
valid_cache_paths(paths) {
    path = paths[_]
    
    # Check if path is in allowed list
    allowed_paths := {
        "node_modules/",
        ".yarn/",
        ".npm/",
        "vendor/",
        "cache/",
        ".gradle/",
        ".m2/"
    }
    
    some allowed_path in allowed_paths
    startswith(path, allowed_path)
}

# Check if artifact configuration is valid
valid_artifact_configuration {
    # Maximum allowed artifact size (in MB)
    max_artifact_size := 1000
    
    # Get all jobs with artifacts
    jobs_with_artifacts := [job | 
        job = input.pipeline.jobs[_]
        job.artifacts != null
    ]
    
    # If no jobs with artifacts, artifact configuration is valid
    count(jobs_with_artifacts) == 0
}

valid_artifact_configuration {
    # Maximum allowed artifact size (in MB)
    max_artifact_size := 1000
    
    # Get all jobs with artifacts
    jobs_with_artifacts := [job | 
        job = input.pipeline.jobs[_]
        job.artifacts != null
    ]
    
    # Check each job's artifact configuration
    job = jobs_with_artifacts[_]
    
    # Check if artifact has paths
    job.artifacts.paths != null
    
    # Check if artifact has expire_in
    job.artifacts.expire_in != null
    
    # Check if artifact size is within limits (if specified)
    not job.artifacts.size_limit or
    parse_size(job.artifacts.size_limit) <= max_artifact_size
}

# Helper function to parse size (e.g., "100MB", "1GB")
parse_size(size_str) {
    # Extract numeric part and unit
    size_value := to_number(trim_suffix(trim_suffix(trim_suffix(size_str, "MB"), "GB"), "KB"))
    
    # Convert to MB based on unit
    contains(size_str, "GB")
    size_mb := size_value * 1024
    
    size_mb
}

parse_size(size_str) {
    # Extract numeric part and unit
    size_value := to_number(trim_suffix(trim_suffix(trim_suffix(size_str, "MB"), "GB"), "KB"))
    
    # Convert to MB based on unit
    contains(size_str, "MB")
    size_mb := size_value
    
    size_mb
}

parse_size(size_str) {
    # Extract numeric part and unit
    size_value := to_number(trim_suffix(trim_suffix(trim_suffix(size_str, "MB"), "GB"), "KB"))
    
    # Convert to MB based on unit
    contains(size_str, "KB")
    size_mb := size_value / 1024
    
    size_mb
}

# Check if service configuration is valid
valid_service_configuration {
    # Get all jobs with services
    jobs_with_services := [job | 
        job = input.pipeline.jobs[_]
        job.services != null
    ]
    
    # If no jobs with services, service configuration is valid
    count(jobs_with_services) == 0
}

valid_service_configuration {
    # Get all jobs with services
    jobs_with_services := [job | 
        job = input.pipeline.jobs[_]
        job.services != null
    ]
    
    # Check each job's service configuration
    job = jobs_with_services[_]
    
    # Check if services are from approved list
    service = job.services[_]
    
    # Check if service name is in allowed list
    allowed_services := {
        "postgres:",
        "mysql:",
        "redis:",
        "mongo:",
        "docker:dind",
        "mcr.microsoft.com/playwright",
        "selenium/standalone-chrome"
    }
    
    some allowed_service in allowed_services
    startswith(service.name, allowed_service)
}

# Violation messages for better error reporting
violation[msg] {
    not valid_resource_requests
    msg := "Resource requests exceed maximum allowed limits (4 CPU cores, 8GB memory)"
}

violation[msg] {
    not valid_job_timeouts
    msg := "Job timeouts exceed maximum allowed limit (60 minutes)"
}

violation[msg] {
    not valid_cache_configuration
    msg := "Invalid cache configuration: must specify key and valid paths"
}

violation[msg] {
    not valid_artifact_configuration
    msg := "Invalid artifact configuration: must specify paths, expire_in, and size within limits"
}

violation[msg] {
    not valid_service_configuration
    msg := "Invalid service configuration: services must be from approved list"
}
