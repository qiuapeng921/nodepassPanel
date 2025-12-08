package task

import (
	"fmt"
	"nodepassPanel/internal/service"

	"github.com/robfig/cron/v3"
)

var c *cron.Cron

func StartTasks() {
	c = cron.New(cron.WithSeconds()) // Support seconds

	monitor := service.NewMonitorService()

	// Check nodes every 30 seconds
	_, err := c.AddFunc("*/30 * * * * *", func() {
		// fmt.Println("Running Node Monitor...")
		monitor.CheckNodes()
	})
	if err != nil {
		fmt.Println("Error scheduling monitor:", err)
	}

	c.Start()
	fmt.Println("Cron Tasks Started")
}

func StopTasks() {
	if c != nil {
		c.Stop()
	}
}
