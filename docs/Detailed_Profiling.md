Profiling means measuring how your program uses system resources while it runs — things like CPU time, memory, I/O, threads, or network activity.
Without profiling, you’re guessing what’s wrong.
With profiling, you’re measuring what’s wrong.

Profiling under load shows what actually consumes time or resources when the system is stressed.
You compare resource usage before and after optimization.

CPU Profile: which functions use most CPU time.
Memory Profile: which parts allocate or retain most memory.
Heap Profile: helps spot memory leaks.
Block Profile: shows goroutine contention.

Databases can become bottlenecks. Postgres has a setting log_min_duration_statement that logs queries taking longer than a threshold (e.g., 200ms).
This helps you find inefficient SQL queries, missing indexes, or N+1 query patterns.
