package initial

import (
	"fmt"
	"nodepassPanel/internal/config"
	"nodepassPanel/pkg/logger"
	"time"

	"github.com/glebarez/sqlite"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

// InitDB 初始化数据库连接
func InitDB(cfg config.DatabaseConfig) (*gorm.DB, error) {
	var dialector gorm.Dialector

	if cfg.Driver == "sqlite" {
		// SQLite 模式，DBName 当作文件名
		dbName := cfg.DbName
		if dbName == "" {
			dbName = "nodepass.db"
		}
		dialector = sqlite.Open(dbName)
	} else {
		// Postgres 模式
		dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=disable TimeZone=Asia/Shanghai",
			cfg.Host,
			cfg.Username,
			cfg.Password,
			cfg.DbName,
			cfg.Port,
		)
		dialector = postgres.Open(dsn)
	}

	// GORM 日志配置
	gormLogMode := gormlogger.Silent
	if config.App.Server.Mode == "debug" {
		gormLogMode = gormlogger.Info
	}

	db, err := gorm.Open(dialector, &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormLogMode),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	// 连接池配置
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(time.Hour)

	logger.Log.Info("Database connection established", zap.String("dbname", cfg.DbName))
	return db, nil
}
