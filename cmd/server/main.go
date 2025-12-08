package main

import (
	"context"
	"fmt"
	"net/http"
	"nodepassPanel/internal/config"
	"nodepassPanel/internal/global"
	"nodepassPanel/internal/handler"
	"nodepassPanel/internal/initial"
	"nodepassPanel/internal/router"
	"nodepassPanel/internal/service"
	"nodepassPanel/internal/task"
	"nodepassPanel/pkg/logger"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/zap"
)

// @title NyanPass API
// @version 1.0
// @description NyanPass 高性能中转面板 API 文档
// @termsOfService https://nyanpass.io/terms

// @contact.name API Support
// @contact.url https://nyanpass.io/support
// @contact.email support@nyanpass.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8081
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description JWT Token 认证，格式：Bearer {token}

func main() {
	// 1. 加载配置
	// 假设配置文件在当前运行目录的 config/config.yaml
	configPath := "config/config.yaml"
	if len(os.Args) > 1 {
		configPath = os.Args[1]
	}

	if err := config.LoadConfig(configPath); err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	// 2. 初始化日志
	if err := logger.InitLogger(&config.App.Log); err != nil {
		fmt.Printf("Failed to init logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Log.Sync()

	logger.Log.Info("Starting NyanPass Panel", zap.String("version", "0.0.1-alpha"))

	// 3. 初始化数据库 (允许失败，方便暂无 DB 环境时的测试)
	db, err := initial.InitDB(config.App.Database)
	if err != nil {
		logger.Log.Error("Database initialization failed", zap.Error(err))
		// 在严格生产环境中这里应该 Panic，但在开发初期暂不强制退出
	} else {
		// 初始化全局变量
		global.InitGlobal(db)

		// 6. 执行数据库迁移 (仅在成功连接数据库时)
		// 在生产环境通常会有独立的迁移命令或流程，这里为了 MVP 方便直接集成
		if err := initial.AutoMigrate(db); err != nil {
			logger.Log.Fatal("Migration failed", zap.Error(err))
		}

		// 7. 初始化默认设置
		settingSvc := service.NewSettingService()
		if err := settingSvc.InitDefaultSettings(); err != nil {
			logger.Log.Error("Failed to init default settings", zap.Error(err))
		}
	}

	// 初始化 Websocket Hub
	handler.InitGlobalHub()

	// 启动后台任务
	task.StartTasks()
	defer task.StopTasks()

	// 4. 初始化路由
	r := router.InitRouter()

	// 5. 启动服务
	srv := &http.Server{
		Addr:    config.App.Server.Port,
		Handler: r,
	}

	go func() {
		logger.Log.Info("Server is starting", zap.String("port", config.App.Server.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Log.Fatal("Server start failed", zap.Error(err))
		}
	}()

	// 优雅退出 (Graceful Shutdown)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Log.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Log.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger.Log.Info("Server exiting")
}
