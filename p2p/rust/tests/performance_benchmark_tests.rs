// 集成测试文件
use p2p::performance_benchmark::{PerformanceTestResult, TestMetrics, save_performance_test_results};
use serde_json;
use std::fs;
use tokio;

#[tokio::test]
async fn test_performance_result_serialization() {
    // 创建测试数据
    let test_metrics = TestMetrics {
        connection_success_rate: 0.95,
        avg_connection_latency: 150.0,
        message_delivery_rate: 0.98,
        avg_message_latency: 50.0,
        throughput: 1000.0,
        cpu_usage: 25.0,
        memory_usage: 50.0,
    };

    let test_result = PerformanceTestResult {
        test_name: "connection_test".to_string(),
        start_time: "2025-08-18T22:40:00Z".to_string(),
        end_time: "2025-08-18T22:41:00Z".to_string(),
        duration: 60000,
        success: true,
        metrics: test_metrics,
        errors: vec![],
    };

    let test_results = vec![test_result];

    // 测试序列化
    let json_data = serde_json::to_string_pretty(&test_results).unwrap();
    assert!(json_data.contains("connection_test"));
    assert!(json_data.contains("success"));
    
    println!("Serialized JSON: {}", json_data);
}

#[tokio::test]
async fn test_save_performance_test_results() {
    // 创建测试数据
    let test_metrics = TestMetrics {
        connection_success_rate: 0.95,
        avg_connection_latency: 150.0,
        message_delivery_rate: 0.98,
        avg_message_latency: 50.0,
        throughput: 1000.0,
        cpu_usage: 25.0,
        memory_usage: 50.0,
    };

    let test_result = PerformanceTestResult {
        test_name: "connection_test".to_string(),
        start_time: "2025-08-18T22:40:00Z".to_string(),
        end_time: "2025-08-18T22:41:00Z".to_string(),
        duration: 60000,
        success: true,
        metrics: test_metrics,
        errors: vec![],
    };

    let test_results = vec![test_result];
    
    // 保存到临时文件
    let temp_file = "temp_test_results.json";
    let result = save_performance_test_results(test_results, temp_file).await;
    
    // 检查文件是否创建成功
    assert!(result.is_ok());
    assert!(fs::metadata(temp_file).is_ok());
    
    // 清理临时文件
    let _ = fs::remove_file(temp_file);
}