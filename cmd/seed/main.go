package main

import (
	"fmt"
	"nodepassPanel/internal/config"
	"nodepassPanel/internal/global"
	"nodepassPanel/internal/initial"
	"nodepassPanel/internal/model"
	"nodepassPanel/pkg/logger"
	"nodepassPanel/pkg/utils"
	"os"

	"go.uber.org/zap"
)

func main() {
	// 1. 加载配置
	configPath := "config/config.yaml"
	if err := config.LoadConfig(configPath); err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	// 2. 初始化日志
	if err := logger.InitLogger(&config.App.Log); err != nil {
		fmt.Printf("Failed to init logger: %v\n", err)
		os.Exit(1)
	}

	// 3. 初始化数据库
	db, err := initial.InitDB(config.App.Database)
	if err != nil {
		logger.Log.Fatal("Database connection failed", zap.Error(err))
	}
	global.InitGlobal(db)

	// Ensure tables exist
	initial.AutoMigrate(db)

	// 4. Seeding Data
	seedAdmin()
	seedNodes()
	seedInstances()
}

func seedAdmin() {
	email := "admin@nyanpass.local"
	var count int64
	global.DB.Model(&model.User{}).Where("email = ?", email).Count(&count)

	if count > 0 {
		logger.Log.Info("Admin user already exists")
		return
	}

	password, _ := utils.HashPassword("NyanPass2025!")
	admin := model.User{
		Email:    email,
		Password: password,
		IsAdmin:  true,
		Status:   1,
		Balance:  999999.00,
	}

	if err := global.DB.Create(&admin).Error; err != nil {
		logger.Log.Error("Failed to create admin", zap.Error(err))
	} else {
		logger.Log.Info("Admin user created", zap.String("email", email), zap.String("password", "NyanPass2025!"))
	}
}

func seedNodes() {
	nodes := []model.Node{
		{
			Name:    "🇭🇰 HKG AWS Premium",
			Address: "1.1.1.1", // Mock IP
			APIPort: 8080,
			Region:  "HK",
			Country: "HK",
			Status:  1,
			Ping:    45,
			Load:    0.34,
		},
		{
			Name:    "🇯🇵 TYO Oracle Direct",
			Address: "2.2.2.2", // Mock IP
			APIPort: 8080,
			Region:  "JP",
			Country: "JP",
			Status:  1,
			Ping:    68,
			Load:    0.12,
		},
		{
			Name:    "🇺🇸 LAX DMIT CN2",
			Address: "3.3.3.3", // Mock IP
			APIPort: 8080,
			Region:  "US",
			Country: "US",
			Status:  1,
			Ping:    145,
			Load:    0.88,
		},
		{
			Name:    "🇸🇬 SIN DigitalOcean",
			Address: "4.4.4.4", // Mock IP
			APIPort: 8080,
			Region:  "SG",
			Country: "SG",
			Status:  0, // Offline
			Ping:    0,
			Load:    0,
		},
	}

	for _, node := range nodes {
		var count int64
		global.DB.Model(&model.Node{}).Where("name = ?", node.Name).Count(&count)
		if count == 0 {
			global.DB.Create(&node)
			logger.Log.Info("Node seed created", zap.String("name", node.Name))
		}
	}
}
