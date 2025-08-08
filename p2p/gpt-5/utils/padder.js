// 将任意 Buffer 切成固定帧并填充；接收端按固定帧长解包
exports.frameAndPad = (buf, frameSize) => {
    if (buf.length > frameSize) throw new Error('message too long for one frame')
    const framed = Buffer.alloc(frameSize)
    buf.copy(framed, 0)
    // 尾部填充为 0（或随机字节），接收端不需知道真实长度
    return framed
}