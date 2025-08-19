// performance_benchmark.rs - 性能基准测试模块
use serde::{Deserialize, Serialize};
use std::error::Error;

// 性能测试结果结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceTestResult {
    pub test_name: String,
    pub start_time: String,
    pub end_time: String,
    pub duration: u64, // 测试持续时间(毫秒)
    pub success: bool,
    pub metrics: TestMetrics,
    pub errors: Vec<String>,
}

// 测试指标结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestMetrics {
    // 连接成功率
    pub connection_success_rate: f64,
    // 平均连接延迟(毫秒)
    pub avg_connection_latency: f64,
    // 消息传输成功率
    pub message_delivery_rate: f64,
    // 平均消息延迟(毫秒)
    pub avg_message_latency: f64,
    // 吞吐量(消息/秒)
    pub throughput: f64,
    // CPU使用率(%)
    pub cpu_usage: f64,
    // 内存使用量(MB)
    pub memory_usage: f64,
}

// 保存性能测试结果到JSON文件
pub async fn save_performance_test_results(
    test_results: Vec<PerformanceTestResult>,
    output_file: &str,
) -> Result<(), Box<dyn Error>> {
    use tokio::fs::File;
    use tokio::io::AsyncWriteExt;
    use serde_json;

    let json_data = serde_json::to_string_pretty(&test_results)?;
    let mut file = File::create(output_file).await?;
    file.write_all(json_data.as_bytes()).await?;
    file.flush().await?;
    println!("性能测试结果已保存到: {}", output_file);
    Ok(())
}