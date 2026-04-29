import TaskDay from '../models/TaskDay.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import SubProject from '../models/SubProject.js';
import { generateTaskPlan } from '../services/aiService.js';

// Helper: get user IDs the current user can see (self + all downward reports, never upward)
async function getTeamUserIds(userId) {
  const allUsers = await User.find({ active: true }).lean();

  // Start from current user and only go downward (people who report to them)
  const teamIds = new Set([userId]);
  let currentParents = [userId];
  while (currentParents.length > 0) {
    const children = allUsers.filter(u =>
      currentParents.includes(u.reportsTo?.toString()) && !teamIds.has(u._id.toString())
    );
    if (children.length === 0) break;
    const nextParents = [];
    children.forEach(c => {
      teamIds.add(c._id.toString());
      nextParents.push(c._id.toString());
    });
    currentParents = nextParents;
  }
  return Array.from(teamIds);
}

// GET /api/taskKeep — get all task days visible to this user
export const getAllDays = async (req, res) => {
  const teamIds = await getTeamUserIds(req.user.userId);
  let managerIds = [...teamIds];
  
  // Always check DB for user's manager
  const currentUser = await User.findById(req.user.userId);
  if (currentUser && currentUser.reportsTo) {
    managerIds.push(currentUser.reportsTo.toString());
  }

  // A user can see days they manage (or their manager manages) OR days that contain tasks assigned to them
  const days = await TaskDay.find({
    $or: [
      { managerId: { $in: managerIds } },
      { 'tasks.assigneeId': req.user.userId },
    ]
  }).sort({ date: -1 });
  res.json(days);
};

// POST /api/taskKeep — create a new date card
export const createDay = async (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required' });

  // Always check DB to find the user's manager via reportsTo
  const currentUser = await User.findById(req.user.userId);
  let managerId = req.user.userId;
  if (currentUser && currentUser.reportsTo) {
    managerId = currentUser.reportsTo;
  }

  // Check if day already exists for this manager
  let existing = await TaskDay.findOne({ date, managerId });
  if (existing) {
    // If the card already exists (manager or another reportee created it),
    // just return it so the user can add tasks to it
    if (managerId.toString() !== req.user.userId) {
       return res.status(200).json(existing);
    }
    return res.status(409).json({ error: 'A card for this date already exists' });
  }

  const day = await TaskDay.create({ date, managerId, tasks: [] });
  res.status(201).json(day);
};

// PUT /api/taskKeep/:dayId — update date card's date
export const updateDay = async (req, res) => {
  const day = await TaskDay.findById(req.params.dayId);
  if (!day) return res.status(404).json({ error: 'Day not found' });
  
  let hasAccess = false;
  if (day.managerId.toString() === req.user.userId) {
    hasAccess = true;
  } else {
    const currentUser = await User.findById(req.user.userId);
    if (currentUser && currentUser.reportsTo && currentUser.reportsTo.toString() === day.managerId.toString()) {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    return res.status(403).json({ error: 'Not authorized to update this card' });
  }

  const { date } = req.body;
  if (date) {
    const existing = await TaskDay.findOne({ date, managerId: day.managerId, _id: { $ne: day._id } });
    if (existing) return res.status(409).json({ error: 'A card for this date already exists' });
    day.date = date;
  }
  await day.save();
  res.json(day);
};

// DELETE /api/taskKeep/:dayId — delete a date card
export const deleteDay = async (req, res) => {
  const day = await TaskDay.findById(req.params.dayId);
  if (!day) return res.status(404).json({ error: 'Day not found' });
  
  let hasAccess = false;
  if (day.managerId.toString() === req.user.userId) {
    hasAccess = true;
  } else {
    const currentUser = await User.findById(req.user.userId);
    if (currentUser && currentUser.reportsTo && currentUser.reportsTo.toString() === day.managerId.toString()) {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    return res.status(403).json({ error: 'Not authorized to delete this card' });
  }
  
  await TaskDay.findByIdAndDelete(req.params.dayId);
  res.json({ message: 'Day deleted successfully' });
};

// POST /api/taskKeep/:dayId/tasks — add a task to a day
export const addTask = async (req, res) => {
  const day = await TaskDay.findById(req.params.dayId);
  if (!day) return res.status(404).json({ error: 'Day not found' });

  const { title, description, assigneeId, projectId, subProjectId, catalogTaskId, status } = req.body;
  const task = {
    title: String(title || ''),
    description: String(description || ''),
    assigneeId: assigneeId || null,
    projectId: projectId || null,
    subProjectId: subProjectId || null,
    catalogTaskId: catalogTaskId || null,
    status: status || 'todo',
    createdBy: req.user.userId,
  };

  day.tasks.push(task);
  day.markModified('tasks');
  await day.save();
  res.status(201).json(day);
};

// PUT /api/taskKeep/:dayId/tasks/:taskId — update a task
export const updateTask = async (req, res) => {
  const day = await TaskDay.findById(req.params.dayId);
  if (!day) return res.status(404).json({ error: 'Day not found' });

  const task = day.tasks.id(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  // Once a task is done, its status cannot be changed
  if (task.status === 'done' && req.body.status !== undefined && req.body.status !== 'done') {
    return res.status(400).json({ error: 'Completed tasks cannot be reverted to another status' });
  }

  // Enforce dependency: if this task depends on another, the other must be 'done' first
  if (req.body.status !== undefined && req.body.status !== 'todo' && task.dependsOn) {
    // Search in same day first
    let depTask = day.tasks.id(task.dependsOn);
    // If not found in same day, search across all days
    if (!depTask) {
      const allDays = await TaskDay.find({ 'tasks._id': task.dependsOn });
      for (const d of allDays) {
        depTask = d.tasks.id(task.dependsOn);
        if (depTask) break;
      }
    }
    if (depTask && depTask.status !== 'done') {
      return res.status(400).json({ error: `Cannot proceed — dependent task "${depTask.title || 'Untitled'}" is not yet done` });
    }
  }

  // Cannot assign a task before a project is mapped
  if (req.body.assigneeId && !task.projectId && !req.body.projectId) {
    return res.status(400).json({ error: 'Please select a project before assigning the task' });
  }

  const { title, description, assigneeId, projectId, subProjectId, catalogTaskId, status, dependsOn } = req.body;
  if (title !== undefined) task.title = String(title);
  if (description !== undefined) task.description = String(description);
  if (assigneeId !== undefined) task.assigneeId = assigneeId;
  if (projectId !== undefined) task.projectId = projectId;
  if (subProjectId !== undefined) task.subProjectId = subProjectId;
  if (catalogTaskId !== undefined) task.catalogTaskId = catalogTaskId;
  if (status !== undefined) task.status = status;
  if (dependsOn !== undefined) task.dependsOn = dependsOn;

  day.markModified('tasks');
  await day.save();
  res.json(day);
};

// DELETE /api/taskKeep/:dayId/tasks/:taskId — delete a task
export const deleteTask = async (req, res) => {
  const day = await TaskDay.findById(req.params.dayId);
  if (!day) return res.status(404).json({ error: 'Day not found' });

  const task = day.tasks.id(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  day.tasks.pull(req.params.taskId);
  await day.save();
  res.json(day);
};

// POST /api/taskKeep/:dayId/tasks/:taskId/move — move a task to another date
export const moveTask = async (req, res) => {
  const { targetDate } = req.body;
  if (!targetDate) return res.status(400).json({ error: 'targetDate is required' });

  const sourceDay = await TaskDay.findById(req.params.dayId);
  if (!sourceDay) return res.status(404).json({ error: 'Source day not found' });

  const task = sourceDay.tasks.id(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  // Remove from source
  const taskData = task.toObject();
  delete taskData._id; // let MongoDB create a new ID in the target
  sourceDay.tasks.pull(req.params.taskId);
  await sourceDay.save();

  // Find or create target day
  let targetDay = await TaskDay.findOne({ date: targetDate, managerId: sourceDay.managerId });
  if (!targetDay) {
    targetDay = await TaskDay.create({ date: targetDate, managerId: sourceDay.managerId, tasks: [] });
  }

  targetDay.tasks.push(taskData);
  await targetDay.save();

  // Return both days so frontend can update state
  res.json({ sourceDay, targetDay });
};

// POST /api/taskKeep/generate-plan — AI generates a task plan
export const generatePlan = async (req, res) => {
  const { projectId, subProjectId, description } = req.body;
  if (!projectId || !description) {
    return res.status(400).json({ error: 'Project and description are required' });
  }

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const subProject = subProjectId ? await SubProject.findById(subProjectId) : null;

  // Get team members (downward reports)
  const teamIds = await getTeamUserIds(req.user.userId);
  const teamMembers = await User.find({ _id: { $in: teamIds }, active: true }).lean();
  const teamForAI = teamMembers.map(u => ({ id: u._id.toString(), name: u.name }));

  // Get sub-projects for this project
  const subProjects = await SubProject.find({ projectId }).lean();
  const subProjForAI = subProjects.map(sp => ({ id: sp._id.toString(), name: sp.name }));

  const tasks = await generateTaskPlan(
    project.name,
    subProject?.name || 'General',
    description,
    teamForAI,
    subProjForAI
  );

  res.json({ tasks, projectId, projectName: project.name });
};

// POST /api/taskKeep/execute-plan — create tasks from a reviewed plan
export const executePlan = async (req, res) => {
  const { tasks, projectId } = req.body;
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: 'No tasks provided' });
  }

  const managerId = req.user.userId;

  // Group tasks by date
  const tasksByDate = {};
  tasks.forEach(t => {
    if (!tasksByDate[t.date]) tasksByDate[t.date] = [];
    tasksByDate[t.date].push(t);
  });

  // Build a map from taskNumber to the actual MongoDB _id (for dependsOn linking)
  const taskNumberToId = {};
  const createdDays = [];

  // Process dates in chronological order
  const sortedDates = Object.keys(tasksByDate).sort();
  for (const date of sortedDates) {
    let day = await TaskDay.findOne({ date, managerId });
    if (!day) {
      day = await TaskDay.create({ date, managerId, tasks: [] });
    }

    for (const task of tasksByDate[date]) {
      const dependsOnId = task.dependsOn ? (taskNumberToId[task.dependsOn] || null) : null;
      day.tasks.push({
        title: String(task.title || ''),
        description: String(task.description || ''),
        assigneeId: task.assigneeId || null,
        projectId: projectId || null,
        subProjectId: task.subProjectId || null,
        status: 'todo',
        dependsOn: dependsOnId,
        createdBy: managerId,
      });

      // Map the taskNumber to the newly created task's _id
      const newTask = day.tasks[day.tasks.length - 1];
      taskNumberToId[task.taskNumber] = newTask._id;
    }

    day.markModified('tasks');
    await day.save();
    createdDays.push(day);
  }

  res.status(201).json({ message: `Created ${tasks.length} tasks across ${sortedDates.length} days`, days: createdDays });
};
