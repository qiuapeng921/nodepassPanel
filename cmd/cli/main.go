package main

import (
	"fmt"
	"nodepassPanel/internal/config"
	"nodepassPanel/internal/global"
	"nodepassPanel/internal/initial"
	"nodepassPanel/internal/model"
	"nodepassPanel/internal/service"
	"nodepassPanel/pkg/logger"
	"nodepassPanel/pkg/utils"
	"os"

	"github.com/spf13/cobra"
	"go.uber.org/zap"
)

var (
	configPath string
	rootCmd    = &cobra.Command{
		Use:   "np-cli",
		Short: "NyanPass 命令行工具",
		Long:  `NyanPass 用于数据库初始化、数据填充和维护的命令行接口。`,
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			// 为所有命令初始化配置和日志
			if err := config.LoadConfig(configPath); err != nil {
				fmt.Printf("加载配置失败: %v\n", err)
				os.Exit(1)
			}
			if err := logger.InitLogger(&config.App.Log); err != nil {
				fmt.Printf("初始化日志失败: %v\n", err)
				os.Exit(1)
			}
			// 初始化数据库
			db, err := initial.InitDB(config.App.Database)
			if err != nil {
				logger.Log.Fatal("数据库连接失败", zap.Error(err))
			}
			global.InitGlobal(db)
		},
	}
)

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func init() {
	rootCmd.PersistentFlags().StringVarP(&configPath, "config", "c", "config/config.yaml", "配置文件路径")

	rootCmd.AddCommand(seedCmd)
	rootCmd.AddCommand(migrateCmd)
	rootCmd.AddCommand(initCmd)
	rootCmd.AddCommand(passwordCmd)
}

// ==================== 命令定义 ====================

var seedCmd = &cobra.Command{
	Use:   "seed",
	Short: "填充数据库初始数据",
	Run: func(cmd *cobra.Command, args []string) {
		seedAdmin()
		logger.Log.Info("数据填充成功")
	},
}

var migrateCmd = &cobra.Command{
	Use:   "migrate",
	Short: "运行数据库迁移",
	Run: func(cmd *cobra.Command, args []string) {
		if err := initial.AutoMigrate(global.DB); err != nil {
			logger.Log.Fatal("迁移失败", zap.Error(err))
		}
		logger.Log.Info("迁移成功")
	},
}

var initCmd = &cobra.Command{
	Use:   "init",
	Short: "初始化系统设置",
	Run: func(cmd *cobra.Command, args []string) {
		// 确保先执行迁移
		if err := initial.AutoMigrate(global.DB); err != nil {
			logger.Log.Fatal("迁移失败", zap.Error(err))
		}

		svc := service.NewSettingService()
		if err := svc.InitDefaultSettings(); err != nil {
			logger.Log.Fatal("初始化默认设置失败", zap.Error(err))
		}
		logger.Log.Info("系统设置初始化完成")
	},
}

var passwordCmd = &cobra.Command{
	Use:   "password <email> <new_password>",
	Short: "重置用户/管理员密码",
	Args:  cobra.ExactArgs(2),
	Run: func(cmd *cobra.Command, args []string) {
		email := args[0]
		newPassword := args[1]

		var user model.User
		if err := global.DB.Where("email = ?", email).First(&user).Error; err != nil {
			logger.Log.Error("用户不存在", zap.String("email", email))
			return
		}

		hashedPassword, err := utils.HashPassword(newPassword)
		if err != nil {
			logger.Log.Error("密码加密失败", zap.Error(err))
			return
		}

		user.Password = hashedPassword
		if err := global.DB.Save(&user).Error; err != nil {
			logger.Log.Error("密码更新失败", zap.Error(err))
			return
		}

		logger.Log.Info("密码重置成功", zap.String("email", email))
	},
}

// ==================== 填充逻辑 ====================

func seedAdmin() {
	email := "admin@qq.com"
	var count int64
	global.DB.Model(&model.User{}).Where("email = ?", email).Count(&count)

	if count > 0 {
		logger.Log.Info("管理员账号已存在")
		return
	}

	password, _ := utils.HashPassword("123456")
	admin := model.User{
		Email:    email,
		Password: password,
		IsAdmin:  true,
		Status:   1,
		Balance:  999999.00,
	}

	if err := global.DB.Create(&admin).Error; err != nil {
		logger.Log.Error("创建管理员失败", zap.Error(err))
	} else {
		logger.Log.Info("管理员账号已创建", zap.String("email", email), zap.String("password", "123456"))
	}
}
