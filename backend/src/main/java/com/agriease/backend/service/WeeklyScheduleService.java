package com.agriease.backend.service;

import com.agriease.backend.dto.WeekPlanDto;
import com.agriease.backend.dto.WeeklyScheduleRequest;
import com.agriease.backend.dto.WeeklyScheduleResponse;
import com.agriease.backend.entity.User;
import com.agriease.backend.entity.WeeklyScheduleRecord;
import com.agriease.backend.exception.BadRequestException;
import com.agriease.backend.exception.ResourceNotFoundException;
import com.agriease.backend.repository.UserRepository;
import com.agriease.backend.repository.WeeklyScheduleRecordRepository;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class WeeklyScheduleService {

    private final UserRepository userRepository;
    private final WeeklyScheduleRecordRepository weeklyScheduleRecordRepository;

    public WeeklyScheduleService(UserRepository userRepository,
                                 WeeklyScheduleRecordRepository weeklyScheduleRecordRepository) {
        this.userRepository = userRepository;
        this.weeklyScheduleRecordRepository = weeklyScheduleRecordRepository;
    }

    public WeeklyScheduleResponse generate(String email, WeeklyScheduleRequest request) {
        if (request == null || request.getCropName() == null || request.getCropName().isBlank()) {
            throw new BadRequestException("Crop name is required");
        }

        String type = normalizeType(request.getScheduleType());
        int totalWeeks = normalizeWeeks(request.getTotalWeeks());
        double landArea = request.getLandAreaAcres() != null && request.getLandAreaAcres() > 0
                ? request.getLandAreaAcres()
                : 1.0;

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<WeekPlanDto> weeks = buildWeekPlan(request.getCropName().trim(), type, totalWeeks, landArea);

        WeeklyScheduleRecord record = new WeeklyScheduleRecord();
        record.setUser(user);
        record.setCropName(request.getCropName().trim());
        record.setScheduleType(type);
        record.setTotalWeeks(totalWeeks);
        record.setLandAreaAcres(landArea);
        record.setScheduleJson(writeJson(weeks));

        WeeklyScheduleRecord saved = weeklyScheduleRecordRepository.save(record);
        return toResponse(saved, weeks);
    }

    public List<WeeklyScheduleResponse> getHistory(String email) {
        return weeklyScheduleRecordRepository.findTop20ByUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(record -> toResponse(record, readWeekPlan(record.getScheduleJson())))
                .toList();
    }

    private List<WeekPlanDto> buildWeekPlan(String cropName, String type, int totalWeeks, double landAreaAcres) {
        List<WeekPlanDto> weeks = new ArrayList<>();
        for (int week = 1; week <= totalWeeks; week++) {
            List<String> tasks = new ArrayList<>();
            String focus;

            if (week == 1) {
                focus = "Land prep and sowing";
                tasks.add("Perform soil test and mark " + landAreaAcres + " acres for " + cropName);
                tasks.add(type.equals("ORGANIC")
                        ? "Apply compost and farmyard manure before sowing"
                        : "Apply basal NPK dose and seed treatment");
                tasks.add("Sow crop with proper spacing and irrigate lightly");
            } else if (week <= 3) {
                focus = "Early growth management";
                tasks.add("Inspect germination and re-sow weak patches");
                tasks.add(type.equals("ORGANIC")
                        ? "Spray jeevamrut/vermicompost tea and install pest traps"
                        : "Apply first top dressing fertilizer and weed control");
                tasks.add("Irrigate based on moisture and weather");
            } else if (week <= 6) {
                focus = "Vegetative growth and crop health";
                tasks.add("Scout for pests/disease twice this week");
                tasks.add(type.equals("ORGANIC")
                        ? "Use neem-based bio-pesticides and mulching"
                        : "Use recommended pesticide/fungicide as needed");
                tasks.add("Monitor canopy growth and nutrient deficiency signs");
            } else {
                focus = "Reproductive stage and harvest planning";
                tasks.add("Plan irrigation interval to avoid stress at flowering/fruiting");
                tasks.add(type.equals("ORGANIC")
                        ? "Use bio-enhancers and foliar organic nutrients"
                        : "Use micronutrient spray if deficiency appears");
                tasks.add("Prepare harvest logistics and market linkage");
            }

            weeks.add(new WeekPlanDto(week, focus, tasks));
        }
        return weeks;
    }

    private WeeklyScheduleResponse toResponse(WeeklyScheduleRecord record, List<WeekPlanDto> weeks) {
        WeeklyScheduleResponse response = new WeeklyScheduleResponse();
        response.setId(record.getId());
        response.setCropName(record.getCropName());
        response.setScheduleType(record.getScheduleType());
        response.setTotalWeeks(record.getTotalWeeks());
        response.setLandAreaAcres(record.getLandAreaAcres());
        response.setCreatedAt(record.getCreatedAt());
        response.setWeeks(weeks);
        return response;
    }

    private String normalizeType(String scheduleType) {
        if (scheduleType == null || scheduleType.isBlank()) {
            return "ORGANIC";
        }
        String normalized = scheduleType.trim().toUpperCase();
        if (!normalized.equals("ORGANIC") && !normalized.equals("INORGANIC")) {
            throw new BadRequestException("Schedule type must be ORGANIC or INORGANIC");
        }
        return normalized;
    }

    private int normalizeWeeks(Integer totalWeeks) {
        int weeks = (totalWeeks == null) ? 8 : totalWeeks;
        if (weeks < 4 || weeks > 16) {
            throw new BadRequestException("Total weeks must be between 4 and 16");
        }
        return weeks;
    }

    private String writeJson(Object payload) {
        if (!(payload instanceof List<?> list)) {
            throw new BadRequestException("Unable to process weekly schedule payload");
        }
        JSONArray weeksArray = new JSONArray();
        list.forEach(item -> {
            WeekPlanDto week = (WeekPlanDto) item;
            JSONObject weekJson = new JSONObject();
            weekJson.put("weekNumber", week.getWeekNumber());
            weekJson.put("focus", week.getFocus());
            weekJson.put("tasks", new JSONArray(week.getTasks()));
            weeksArray.put(weekJson);
        });
        return weeksArray.toString();
    }

    private List<WeekPlanDto> readWeekPlan(String payload) {
        try {
            JSONArray weeksArray = new JSONArray(payload);
            List<WeekPlanDto> weeks = new ArrayList<>();
            for (int i = 0; i < weeksArray.length(); i++) {
                JSONObject weekJson = weeksArray.getJSONObject(i);
                JSONArray tasksArray = weekJson.optJSONArray("tasks");
                List<String> tasks = new ArrayList<>();
                if (tasksArray != null) {
                    for (int t = 0; t < tasksArray.length(); t++) {
                        tasks.add(tasksArray.optString(t));
                    }
                }
                weeks.add(new WeekPlanDto(
                        weekJson.optInt("weekNumber"),
                        weekJson.optString("focus"),
                        tasks
                ));
            }
            return weeks;
        } catch (Exception e) {
            throw new BadRequestException("Unable to parse saved weekly schedule payload");
        }
    }
}
