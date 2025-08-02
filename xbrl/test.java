// 引入工具类
import api.VoucherFileUtil;
import api.VoucherFileInfo;

public class XbrlProcessor {
    public static void main(String[] args) {
        // 调用工具包 API 方法
        VoucherFileInfo info = VoucherFileUtil.extractXBRLFromOFD("250F981968D9.ofd");
        // 处理返回结果...
    }
}
