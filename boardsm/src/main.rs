#[derive(Clone, Copy)]
struct Task(usize);

struct TaskData {
    content: String,
    after: Option<Task>,
    child: Option<Task>,
}

struct Column {
    title: String,
    child: Option<Task>,
}

struct Board {
    title: String,
    columns: Vec<Column>,
    tasks: Vec<TaskData>,
}

impl Board {
    pub fn new(title: String) -> Self {
        Self {
            title,
            columns: vec![],
            tasks: vec![],
        }
    }

    pub fn add_col(&mut self, title: String) {
        let column = Column { title, child: None };
        self.columns.push(column);
    }

    pub fn add_task(&mut self, tgt: &mut Column, content: String) {
        let created = self.make_task(content);

        match tgt.child {
            Some(id) => {
                self.task_mut(self.last_task_sibling(id)).after = Some(created);
            }
            None => {
                tgt.child = Some(created);
            }
        };
    }

    pub fn add_subtask(&mut self, tgt: Task, content: String) {
        let created = self.make_task(content);

        match self.task(tgt).child {
            Some(id) => {
                self.task_mut(self.last_task_sibling(id)).after = Some(created);
            }
            None => {
                self.task_mut(tgt).child = Some(created);
            }
        };
    }

    pub fn last_task_sibling(&self, task: Task) -> Task {
        match self.task(task).after {
            Some(task) => self.last_task_sibling(task),
            None => task,
        }
    }

    fn task(&self, task: Task) -> &TaskData {
        &self.tasks[task.0]
    }

    fn task_mut(&mut self, task: Task) -> &mut TaskData {
        &mut self.tasks[task.0]
    }

    fn make_task(&mut self, content: String) -> Task {
        let task = Task(self.tasks.len());
        self.tasks.push(TaskData {
            content,
            after: None,
            child: None,
        });
        return task;
    }
}

fn main() {
    println!("Hello, world!");
}
