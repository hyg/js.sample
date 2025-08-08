


### VTODO vs VEVENT

一句话总结  
- **VEVENT** =「日程事件」：有明确的 **开始-结束时间**，用于日历上的“会议”“约会”。  
- **VTODO**   =「待办任务」：只有 **到期日（DUE）或完成百分比**，用于 To-Do List。  

核心差异一览表

| 维度 | VEVENT | VTODO |
|---|---|---|
| 语义 | 发生在某一时间段内的“事件” | 需要完成的“任务/待办” |
| 必含字段 | DTSTART (+ DTEND 或 DURATION) | 无强制时间字段，可选 DUE / COMPLETED |
| 时间轴 | 占用日历格子（可冲突检测） | 不占用时间段，仅显示截止日 |
| 状态字段 | STATUS:CONFIRMED / TENTATIVE / CANCELLED … | STATUS:NEEDS-ACTION / IN-PROCESS / COMPLETED … |
| 完成度 | 无 | 可用 COMPLETED、PERCENT-COMPLETE |
| 适用 UI | 日历日/周视图 | 任务清单、GTD 应用 |
| CalDAV 支持 | 几乎所有日历集合默认接受 | 仅当集合声明 `<C:comp name="VTODO"/>` 时才接受 |

为什么不能混放  
RFC 4791 规定：一个日历资源文件 **只能包含同一类组件**（VEVENT 或 VTODO），不能混搭；必须分开放到不同日历集合。

举例  
- 会议邀请 → VEVENT  
- 写周报 → VTODO