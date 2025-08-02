import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.io.File;

public class Invoker {
    public static void main(String[] args) {
        if (args.length < 1) {
            System.err.println("Usage: java Invoker <methodName> [args...]");
            System.exit(1);
        }

        String methodName = args[0];
        String[] methodArgs = new String[args.length - 1];
        System.arraycopy(args, 1, methodArgs, 0, methodArgs.length);

        try {
            System.err.println("=== Java 调试信息 ===");
            System.err.println("方法名: " + methodName);
            System.err.println("参数数量: " + methodArgs.length);
            for (int i = 0; i < methodArgs.length; i++) {
                System.err.println("参数[" + i + "]: " + methodArgs[i]);
            }
            System.err.println("===================");
            
            // 加载目标类
            Class<?> voucherClass = Class.forName("api.VoucherFileUtil");
            System.err.println("成功加载类: " + voucherClass.getName());
            
            // 根据方法名调用不同的方法
            switch (methodName) {
                case "extractXBRLFromOFD":
                    System.err.println("执行 extractXBRLFromOFD 方法...");
                    handleExtraction(voucherClass, methodName, methodArgs);
                    break;
                    
                case "extractXBRLFromPDF":
                    System.err.println("执行 extractXBRLFromPDF 方法...");
                    handleExtraction(voucherClass, methodName, methodArgs);
                    break;
                    
                case "json2Xbrl":
                    System.err.println("执行 json2Xbrl 方法...");
                    if (methodArgs.length == 2) {
                        Method method = voucherClass.getMethod("json2Xbrl", String.class, String.class);
                        System.err.println("找到方法: " + method);
                        String result = (String) method.invoke(null, methodArgs[0], methodArgs[1]);
                        System.err.println("JSON 转 XBRL 完成，结果长度: " + (result != null ? result.length() : 0));
                        System.out.println(result);
                    } else {
                        throw new IllegalArgumentException("Invalid arguments for json2Xbrl");
                    }
                    break;
                    
                case "xbrl2Json":
                    System.err.println("执行 xbrl2Json 方法...");
                    if (methodArgs.length == 2) {
                        Method method = voucherClass.getMethod("xbrl2Json", String.class, String.class);
                        System.err.println("找到方法: " + method);
                        Object result = method.invoke(null, methodArgs[0], methodArgs[1]);
                        System.err.println("XBRL 转 JSON 完成");
                        System.out.println(result.toString());
                    } else {
                        throw new IllegalArgumentException("Invalid arguments for xbrl2Json");
                    }
                    break;
                    
                case "xbrl2JsonFromFile":
                    System.err.println("执行 xbrl2JsonFromFile 方法...");
                    if (methodArgs.length == 2) {
                        // 从文件读取 XBRL 内容
                        String filePath = methodArgs[0];
                        String configId = methodArgs[1];
                        System.err.println("从文件读取 XBRL: " + filePath);
                        
                        try {
                            String xbrlContent = new String(Files.readAllBytes(Paths.get(filePath)));
                            System.err.println("读取成功，内容长度: " + xbrlContent.length());
                            
                            Method method = voucherClass.getMethod("xbrl2Json", String.class, String.class);
                            System.err.println("找到方法: " + method);
                            Object result = method.invoke(null, xbrlContent, configId);
                            System.err.println("XBRL 转 JSON 完成");
                            System.out.println(result.toString());
                        } catch (Exception e) {
                            System.err.println("读取文件或转换出错: " + e.getMessage());
                            System.out.println("{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
                        }
                    } else {
                        throw new IllegalArgumentException("Invalid arguments for xbrl2JsonFromFile");
                    }
                    break;
                    
                case "xml2Json":
                    System.err.println("执行 xml2Json 方法...");
                    if (methodArgs.length == 1) {
                        Method method = voucherClass.getMethod("xml2Json", String.class);
                        System.err.println("找到方法: " + method);
                        Object result = method.invoke(null, methodArgs[0]);
                        System.err.println("XML 转 JSON 完成");
                        System.out.println(result.toString());
                    } else {
                        throw new IllegalArgumentException("Invalid arguments for xml2Json");
                    }
                    break;
                    
                case "extractAttachFromPDF":
                    System.err.println("执行 extractAttachFromPDF 方法...");
                    if (methodArgs.length == 2) {
                        Method method = voucherClass.getMethod("extractAttachFromPDF", String.class, String.class);
                        System.err.println("找到方法: " + method);
                        method.invoke(null, methodArgs[0], methodArgs[1]);
                        System.err.println("PDF 附件提取完成");
                        System.out.println("{\"status\":\"success\",\"message\":\"Attachments extracted successfully\"}");
                    } else {
                        throw new IllegalArgumentException("Invalid arguments for extractAttachFromPDF");
                    }
                    break;
                    
                case "extractXMLFromPDF":
                    System.err.println("执行 extractXMLFromPDF 方法...");
                    if (methodArgs.length == 1) {
                        Method method = voucherClass.getMethod("extractXMLFromPDF", String.class);
                        System.err.println("找到方法: " + method);
                        String result = (String) method.invoke(null, methodArgs[0]);
                        System.err.println("PDF XML 提取完成，结果长度: " + (result != null ? result.length() : 0));
                        System.out.println(result);
                    } else {
                        throw new IllegalArgumentException("Invalid arguments for extractXMLFromPDF");
                    }
                    break;
                    
                case "extractXMLFromCEBPDF":
                    System.err.println("执行 extractXMLFromCEBPDF 方法...");
                    if (methodArgs.length == 1) {
                        Method method = voucherClass.getMethod("extractXMLFromCEBPDF", String.class);
                        System.err.println("找到方法: " + method);
                        String result = (String) method.invoke(null, methodArgs[0]);
                        System.err.println("CEB PDF XML 提取完成，结果长度: " + (result != null ? result.length() : 0));
                        System.out.println(result);
                    } else {
                        throw new IllegalArgumentException("Invalid arguments for extractXMLFromCEBPDF");
                    }
                    break;
                    
                default:
                    throw new IllegalArgumentException("Unknown method: " + methodName);
            }
        } catch (Exception e) {
            System.err.println("Java 执行出错:");
            System.err.println("错误类型: " + e.getClass().getName());
            System.err.println("错误信息: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
    
    private static void handleExtraction(Class<?> voucherClass, String methodName, String[] methodArgs) throws Exception {
        Object result = null;
        
        // 检查输入文件
        if (methodArgs.length == 0) {
            System.out.println("{\"error\":\"No input file specified\"}");
            return;
        }
        
        String inputFile = methodArgs[0];
        File input = new File(inputFile);
        if (!input.exists()) {
            System.out.println("{\"error\":\"Input file not found: " + inputFile + "\"}");
            return;
        }
        
        System.err.println("输入文件存在: " + inputFile + " (" + input.length() + " bytes)");
        
        // 调用提取方法
        if (methodArgs.length == 1) {
            Method method = voucherClass.getMethod(methodName, String.class);
            System.err.println("调用单参数方法: " + method);
            result = method.invoke(null, methodArgs[0]);
        } else if (methodArgs.length == 2) {
            // 确保输出目录存在
            String outputFile = methodArgs[1];
            File outputDir = new File(outputFile).getParentFile();
            if (outputDir != null && !outputDir.exists()) {
                outputDir.mkdirs();
                System.err.println("创建输出目录: " + outputDir.getAbsolutePath());
            }
            
            Method method = voucherClass.getMethod(methodName, String.class, String.class);
            System.err.println("调用双参数方法: " + method);
            result = method.invoke(null, methodArgs[0], methodArgs[1]);
        } else {
            throw new IllegalArgumentException("Invalid arguments for " + methodName);
        }
        
        System.err.println("提取方法调用完成");
        
        // 处理结果
        if (result != null) {
            Class<?> resultClass = result.getClass();
            StringBuilder json = new StringBuilder("{");
            
            // 获取xbrlFilePath
            String xbrlFilePath = null;
            try {
                Method getXbrlFilePathMethod = resultClass.getMethod("getXbrlFilePath");
                xbrlFilePath = (String) getXbrlFilePathMethod.invoke(result);
                System.err.println("XBRL 文件路径: " + xbrlFilePath);
                json.append("\"xbrlFilePath\":\"").append(escapeJson(xbrlFilePath)).append("\",");
            } catch (NoSuchMethodException e) {
                System.err.println("没有 getXbrlFilePath 方法");
                json.append("\"xbrlFilePath\":\"\",");
            }
            
            // 获取voucherType
            String voucherType = null;
            try {
                Method getVoucherTypeMethod = resultClass.getMethod("getVoucherType");
                voucherType = (String) getVoucherTypeMethod.invoke(result);
                System.err.println("凭证类型: " + voucherType);
                json.append("\"voucherType\":\"").append(escapeJson(voucherType)).append("\",");
            } catch (NoSuchMethodException e) {
                System.err.println("没有 getVoucherType 方法");
                json.append("\"voucherType\":\"\",");
            }
            
            // 尝试读取文件内容
            String content = "";
            if (xbrlFilePath != null && !xbrlFilePath.isEmpty()) {
                try {
                    File file = new File(xbrlFilePath);
                    if (file.exists()) {
                        content = new String(Files.readAllBytes(Paths.get(xbrlFilePath)));
                        System.err.println("XBRL 内容长度: " + content.length());
                        json.append("\"content\":\"").append(escapeJson(content)).append("\"");
                    } else {
                        System.err.println("XBRL 文件不存在: " + xbrlFilePath);
                        json.append("\"error\":\"File not found: " + xbrlFilePath + "\"");
                    }
                } catch (Exception e) {
                    System.err.println("读取 XBRL 文件出错: " + e.getMessage());
                    json.append("\"error\":\"Failed to read file: " + e.getMessage() + "\"");
                }
            } else {
                System.err.println("没有可用的 XBRL 文件路径");
                json.append("\"error\":\"No XBRL file path available\"");
            }
            
            json.append("}");
            System.out.println(json.toString());
        } else {
            System.err.println("提取方法返回 null");
            System.out.println("{\"error\":\"No result returned\"}");
        }
    }
    
    // 转义JSON字符串中的特殊字符
    private static String escapeJson(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\r", "\\r")
                  .replace("\n", "\\n")
                  .replace("\t", "\\t");
    }
}