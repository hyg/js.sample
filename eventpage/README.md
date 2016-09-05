##基于页面的消息机制
event page

###概述
无中心的消息机制需要在各节点独立完成消息处理，为了避免直接操作本地数据，需要把消息处理代码封装在规定的环境内。

本项目借助浏览器对页面代码的保护，实现这一特性。

###事件队列
event queue是一个数组，每个元素是一个数组sync queue：保存一个最小时间单位内（暂时为1ms）的事件，sync queue内这些同时发生的事件也被强制排序保存为一个数组。

一个节点保存着它最后一次处理事件的时间点，每次启动后更新事件队列，然后从上次的时间点开始逐个处理事件。

###事件处理页面
节点根据事件发生时有效的脚本创建一系列事件处理页面，然后调用本地浏览器打开每个页面。当某个事件创建了新的有效脚本，或使某个脚本失效，也要适当的创建/删除、启动/关闭页面。

这些页面启动后，向节点主程序索取当前事件，逐一处理。处理过程产生的新事件，须调用主程序统一创建接口，它们会依照全局统一的次序加入到event queue的某处。

主程序必须等待所有有效页面处理结束后，方才向各页面推送下一个事件。


### event.js
事件处理机制的主程序。

* 维护消息队列，接收外来消息，接收消息处理页面POST来的消息并正确写入队列。
* 按照时序为每个消息创建处理页面，以此激活它。


### event.util.js
消息处理页面使用的工具集。

* 读取并解析记录。
* 根据规则验证并写入记录。
* 

### {COD}.js
某个COD的事件处理函数。要求函数名与事件名相同。

### event.pug
一个页面模版，由event.js渲染数据后，调动浏览器现实这个页面。从而激活事件处理代码。

这个页面每次处理一个消息，处理过程发出的新消息POST给event.js。


### to do
向页面送比较大的文本数据，因为不能让它读硬盘文件，所以事件相关信息要主动送过去。