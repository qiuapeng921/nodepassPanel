package initial

import (
	"nodepassPanel/internal/model"
	"nodepassPanel/pkg/logger"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

// AutoMigrate 执行数据库迁移
func AutoMigrate(db *gorm.DB) error {
	logger.Log.Info("Starting database migration...")

	// 注册需要迁移的模型
	err := db.AutoMigrate(
		&model.User{},
		&model.Node{},
		&model.Plan{},
		&model.Instance{},
		&model.Order{},
		&model.Announcement{},
		&model.Coupon{},
		&model.Setting{},
		&model.VerifyCode{},
		&model.InviteRecord{},
	)

	if err != nil {
		logger.Log.Error("Database migration failed", zap.Error(err))
		return err
	}

	logger.Log.Info("Database migration completed successfully")
	return nil
}
