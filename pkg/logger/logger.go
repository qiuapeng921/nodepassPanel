package logger

import (
	"os"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var Log *zap.Logger

// Config 日志配置结构
type Config struct {
	Level      string `mapstructure:"level"`
	Filename   string `mapstructure:"filename"`
	MaxSize    int    `mapstructure:"max_size"`    // MB
	MaxBackups int    `mapstructure:"max_backups"` // 文件个数
	MaxAge     int    `mapstructure:"max_age"`     // 天数
	Compress   bool   `mapstructure:"compress"`
}

// InitLogger 初始化日志组件
func InitLogger(cfg *Config) error {
	// 定义日志级别
	var level zapcore.Level
	if err := level.UnmarshalText([]byte(cfg.Level)); err != nil {
		level = zap.InfoLevel
	}

	// 编码器配置
	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.CapitalLevelEncoder,    // 大写编码器
		EncodeTime:     CustomTimeEncoder,              // 自定义时间格式
		EncodeDuration: zapcore.SecondsDurationEncoder, // 秒级时长
		EncodeCaller:   zapcore.ShortCallerEncoder,     // 短路径编码器
	}

	// 核心配置 (这里简化了 WriteSyncer，生产环境建议配合 lumberjack 进行日志切割)
	// 目前先输出到 Console 和 File (简单 File 模式，后续建议加 lumberjack)
	logFile, _ := os.OpenFile(cfg.Filename, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)

	core := zapcore.NewCore(
		zapcore.NewJSONEncoder(encoderConfig), // json 格式
		zapcore.NewMultiWriteSyncer(zapcore.AddSync(os.Stdout), zapcore.AddSync(logFile)),
		level,
	)

	// 开启开发模式，堆栈跟踪
	caller := zap.AddCaller()
	// 开启文件路行号
	development := zap.Development()

	// 构造日志
	Log = zap.New(core, caller, development)

	// 替换全局 Log
	zap.ReplaceGlobals(Log)

	Log.Info("Logger initialized successfully", zap.String("level", cfg.Level))
	return nil
}

// CustomTimeEncoder 自定义时间格式
func CustomTimeEncoder(t time.Time, enc zapcore.PrimitiveArrayEncoder) {
	enc.AppendString(t.Format("2006-01-02 15:04:05.000"))
}
