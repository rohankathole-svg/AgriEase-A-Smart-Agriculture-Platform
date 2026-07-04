package com.agriease.backend.dto;

import java.util.List;

public class WeekPlanDto {
    private Integer weekNumber;
    private String focus;
    private List<String> tasks;

    public WeekPlanDto() {
    }

    public WeekPlanDto(Integer weekNumber, String focus, List<String> tasks) {
        this.weekNumber = weekNumber;
        this.focus = focus;
        this.tasks = tasks;
    }

    public Integer getWeekNumber() {
        return weekNumber;
    }

    public void setWeekNumber(Integer weekNumber) {
        this.weekNumber = weekNumber;
    }

    public String getFocus() {
        return focus;
    }

    public void setFocus(String focus) {
        this.focus = focus;
    }

    public List<String> getTasks() {
        return tasks;
    }

    public void setTasks(List<String> tasks) {
        this.tasks = tasks;
    }
}
