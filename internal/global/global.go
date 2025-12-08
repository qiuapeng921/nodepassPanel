package global

import (
	"nodepassPanel/pkg/logger"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

var (
	DB  *gorm.DB
	Log *zap.Logger
)

// InitGlobal 初始化全局变量
func InitGlobal(db *gorm.DB) {
	DB = db
	Log = logger.Log
}
