const model = require("./evaluation.model");

exports.generateTimeSlots = (
  startTime,
  endTime,
  duration,
  buffer
) => {

  let slots = [];
  let current = new Date(`1970-01-01T${startTime}`);
  let end = new Date(`1970-01-01T${endTime}`);
  let count = 1;

  while (current < end) {

    let slotStart = new Date(current);
    current.setMinutes(current.getMinutes() + duration);
    let slotEnd = new Date(current);

    if (slotEnd > end) break;

    slots.push({
      slot_sequence_no: count++,
      start: slotStart.toTimeString().substring(0,5),
      end: slotEnd.toTimeString().substring(0,5),
      buffer_applied: true
    });

    current.setMinutes(current.getMinutes() + buffer);
  }

  return slots;
};

exports.createSchedule = async (data) => {
  return await model.createSchedule(data);
};