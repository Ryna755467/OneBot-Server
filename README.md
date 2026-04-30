> v1.0.0 - v1.1.4 15 Tags

### v1.1.5 - fix: 消息发送的时序性问题

- 业务层不再单独处理ApiResponse，统一在NapCatService协议层处理，并返回Promise
- 插件内通过await获取API响应结果
