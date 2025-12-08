# NyanPass Panel (Go Version)

NyanPass 是一个高性能的流量中转面板，后端采用 Go (Gin + GORM) 重构，旨在提供更稳定、高效的服务。

## ✨ 特性

- **高性能架构**: 基于 Gin 框架，模块化设计 (Handler/Service/Repository)。
- **多协议支持**: 完美支持 NodePass 协议，兼容 Surge/Shadowrocket/Clash 等客户端订阅。
- **支付系统**: 集成 Stripe 和 EPay (支付宝/微信) 接口。
- **实时通信**: 基于 WebSocket 的实时节点状态推送。
- **监控告警**: 内置节点健康检查与故障转移逻辑。
- **优惠券系统**: 灵活的优惠券创建与核销。

## 🛠️ 技术栈

- **语言**: Go 1.22+
- **Web 框架**: Gin
- **ORM**: GORM (支持 MySQL/PostgreSQL/SQLite)
- **配置**: Viper
- **日志**: Zap
- **文档**: Swagger
- **支付**: Stripe-Go
- **WebSocket**: Gorilla WebSocket
- **定时任务**: Robfig Cron

## 🚀 快速开始

### 1. 环境准备
确保已安装 Go 1.22 或更高版本。

### 2. 克隆项目
```bash
git clone https://github.com/your/nodepassPanel.git
cd nodepassPanel
```

### 3. 安装依赖
```bash
go mod tidy
```

### 4. 配置文件
复制示例配置并修改：
```bash
cp config/config.example.yaml config/config.yaml
```
修改 `config.yaml` 中的数据库和服务器配置。

### 5. 运行开发服务器
```bash
go run cmd/server/main.go
```
或编译运行：
```bash
go build -o server.exe ./cmd/server
./server.exe
```

## 📂 目录结构

```
├── cmd/                # 入口文件 (server, seed)
├── config/             # 配置文件
├── internal/           # 内部业务逻辑
│   ├── config/         # 配置加载
│   ├── global/         # 全局变量 (DB, Log)
│   ├── handler/        # 控制层 (HTTP Handler)
│   ├── middleware/     # 中间件 (JWT, CORS, RateLimit)
│   ├── model/          # 数据模型
│   ├── payment/        # 支付驱动 (Stripe, EPay)
│   ├── repository/     # 数据访问层
│   ├── router/         # 路由定义
│   ├── service/        # 业务逻辑层
│   ├── task/           # 定时任务
│   └── websocket/      # WebSocket 处理
├── pkg/                # 公共包 (Logger, Response, Utils)
└── docs/               # Swagger 文档
```

## 📝 开发规范

- 遵循 RESTful API 设计风格。
- 采用分层架构，保持代码解耦。
- 关键逻辑必须包含中文注释。
- 提交代码前确保通过 `go vet` 和 `go lint`。
