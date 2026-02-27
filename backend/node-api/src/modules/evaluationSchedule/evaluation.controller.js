
const service = require("./evaluation.service");

exports.createSchedule = async (req, res) => {
  try {
    const {
      assessment_id,
      location_id,
      date,
      start_time,
      end_time,
      duration_per_group_minutes,
      buffer_minutes,
      total_groups
    } = req.body;

    // Slots generation 
    const slots = service.generateTimeSlots(
      start_time,
      end_time,
      duration_per_group_minutes,
      buffer_minutes
    );

    // Schedule saving 
    const scheduleId = await service.createSchedule({
      assessment_id,
      location_id,
      date,
      start_time,
      end_time,
      duration_per_group_minutes,
      buffer_minutes,
      total_groups
    });

    res.json({
      message: "Schedule created successfully",
      scheduleId,
      slots
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};