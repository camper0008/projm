use crate::id::{Id, IdGen};

type Ptr<T> = Option<Box<T>>;

#[derive(Debug)]
pub struct Task {
    pub id: Id,
    pub content: String,
    pub after: Ptr<Task>,
    pub child: Ptr<Task>,
}

#[derive(Debug)]
pub struct Column {
    pub id: Id,
    pub title: String,
    pub child: Ptr<Task>,
    pub after: Ptr<Column>,
}

#[derive(Debug)]
pub struct Board {
    pub id: Id,
    pub title: String,
    pub child: Option<Box<Column>>,
}

pub enum TaskPosition {
    FirstChildOf(Id),
    After(Id),
}

pub enum ColumnPosition {
    FirstChild,
    After(Id),
}

pub enum Action {
    AddColumn { title: String },
    AddTask { dest: Id, content: String },
    DeleteColumn { dest: Id },
    DeleteTask { dest: Id },
    MoveTask { src: Id, dest: TaskPosition },
    MoveColumn { src: Id, dest: ColumnPosition },
    EditTask { dest: Id, content: String },
    EditColumn { dest: Id, title: String },
    EditBoard { title: String },
}

impl Board {
    pub fn new(id: Id, title: String) -> Self {
        Self {
            id,
            title,
            child: None,
        }
    }

    pub fn feed_action(&mut self, id_gen: &mut IdGen, action: Action) {
        match action {
            Action::AddColumn { title } => Self::add_column_to_board_last_child(
                self,
                Column {
                    id: id_gen.gen(),
                    title,
                    child: None,
                    after: None,
                },
            ),
            Action::AddTask { dest, content } => {
                let src = Task {
                    id: id_gen.gen(),
                    content,
                    after: None,
                    child: None,
                };
                let root = self.child.as_mut().expect("should exist idk");
                let column = Self::column_from_id(root, dest);
                if let Some(column) = column {
                    return Self::add_task_to_column_last_child(column, src);
                }

                let task = Self::task_from_id(root, dest);
                if let Some(task) = task {
                    return Self::add_task_to_task_last_child(task, src);
                }
            }
            Action::DeleteColumn { dest } => {
                Self::remove_column(self, dest);
            }
            Action::DeleteTask { dest } => {
                Self::remove_task(self, dest);
            }
            Action::MoveTask { src, dest } => {
                let src = Self::remove_task(self, src);
                let root = self.child.as_mut().expect("should exist idk");
                match dest {
                    TaskPosition::FirstChildOf(id) => {
                        let column = Self::column_from_id(root, id);
                        if let Some(column) = column {
                            return Self::add_task_to_column_first_child(column, src);
                        }

                        let task = Self::task_from_id(root, id);
                        if let Some(task) = task {
                            return Self::add_task_to_task_first_child(task, src);
                        }
                    }
                    TaskPosition::After(id) => {
                        let task = Self::task_from_id(root, id);
                        if let Some(task) = task {
                            return Self::add_task_after_task(task, src);
                        }
                    }
                }
            }
            Action::MoveColumn { src, dest } => {
                let src = Self::remove_column(self, src);
                match dest {
                    ColumnPosition::FirstChild => {
                        Self::add_column_to_board_first_child(self, src);
                    }
                    ColumnPosition::After(dest) => {
                        let root = self.child.as_mut().expect("should exist idk");
                        let dest = Self::column_from_id(root, dest).expect("should exist idk");
                        Self::add_column_after_column(dest, src);
                    }
                }
            }
            Action::EditTask { dest, content } => {
                let root = self.child.as_mut().expect("should exist idk");
                let dest = Self::task_from_id(root, dest).expect("should exist idk");
                dest.content = content;
            }
            Action::EditColumn { dest, title } => {
                let root = self.child.as_mut().expect("should exist idk");
                let dest = Self::column_from_id(root, dest).expect("should exist idk");
                dest.title = title;
            }
            Action::EditBoard { title } => {
                self.title = title;
            }
        }
    }

    fn last_task_sibling(item: &mut Task) -> &mut Task {
        match item.after {
            Some(ref mut item) => Self::last_task_sibling(item),
            None => item,
        }
    }

    fn last_column_sibling(item: &mut Column) -> &mut Column {
        match item.after {
            Some(ref mut item) => Self::last_column_sibling(item),
            None => item,
        }
    }

    fn column_from_id(column: &mut Column, target: Id) -> Option<&mut Column> {
        if column.id == target {
            return Some(column);
        }

        column
            .after
            .as_mut()
            .and_then(|column| Self::column_from_id(column, target))
    }

    fn task_from_id_and_task(task: &mut Task, target: Id) -> Option<&mut Task> {
        if task.id == target {
            return Some(task);
        }

        let child = task
            .child
            .as_mut()
            .and_then(|v| Self::task_from_id_and_task(v, target));

        if let Some(child) = child {
            return Some(child);
        }

        task.after
            .as_mut()
            .and_then(|task| Self::task_from_id_and_task(task, target))
    }

    fn task_from_id(column: &mut Column, target: Id) -> Option<&mut Task> {
        let child = column
            .child
            .as_mut()
            .and_then(|v| Self::task_from_id_and_task(v, target));

        if let Some(child) = child {
            return Some(child);
        }

        column
            .after
            .as_mut()
            .and_then(|column| Self::task_from_id(column, target))
    }

    fn add_column_after_column(dest: &mut Column, mut column: Column) {
        match dest.after.take() {
            Some(after) => {
                column.after = Some(after);
                dest.after = Some(Box::new(column));
            }
            None => dest.after = Some(Box::new(column)),
        }
    }

    fn add_task_after_task(dest: &mut Task, mut task: Task) {
        match dest.after.take() {
            Some(after) => {
                task.after = Some(after);
                dest.after = Some(Box::new(task));
            }
            None => dest.after = Some(Box::new(task)),
        }
    }

    fn add_task_to_column_last_child(dest: &mut Column, task: Task) {
        match dest.child {
            Some(ref mut child) => Self::last_task_sibling(child).after = Some(Box::new(task)),
            None => dest.child = Some(Box::new(task)),
        }
    }

    fn add_task_to_column_first_child(dest: &mut Column, mut task: Task) {
        match dest.child.take() {
            Some(child) => {
                task.after = Some(child);
                dest.child = Some(Box::new(task));
            }
            None => dest.child = Some(Box::new(task)),
        }
    }

    fn add_task_to_task_first_child(dest: &mut Task, mut task: Task) {
        match dest.child.take() {
            Some(child) => {
                task.after = Some(child);
                dest.child = Some(Box::new(task));
            }
            None => dest.child = Some(Box::new(task)),
        }
    }

    fn add_task_to_task_last_child(dest: &mut Task, task: Task) {
        match dest.child {
            Some(ref mut child) => Self::last_task_sibling(child).after = Some(Box::new(task)),
            None => dest.child = Some(Box::new(task)),
        }
    }

    fn add_column_to_board_first_child(dest: &mut Self, mut column: Column) {
        match dest.child.take() {
            Some(child) => {
                column.after = Some(child);
                dest.child = Some(Box::new(column));
            }
            None => dest.child = Some(Box::new(column)),
        }
    }

    fn add_column_to_board_last_child(dest: &mut Self, column: Column) {
        match &mut dest.child {
            Some(child) => Self::last_column_sibling(child).after = Some(Box::new(column)),
            None => dest.child = Some(Box::new(column)),
        }
    }

    fn remove_task_from_task(position: &mut Ptr<Task>, target: Id) -> Option<Task> {
        let Some(mut task) = position.take() else {
            return None;
        };
        if task.id == target {
            *position = task.after.take();
            return Some(*task);
        }

        if let Some(child) = Self::remove_task_from_task(&mut task.child, target) {
            *position = Some(task);
            return Some(child);
        };
        if let Some(after) = Self::remove_task_from_task(&mut task.after, target) {
            *position = Some(task);
            return Some(after);
        };
        *position = Some(task);

        None
    }

    fn remove_task(board: &mut Self, target: Id) -> Task {
        let mut current = board
            .child
            .as_mut()
            .expect("should not reach invalid state");
        loop {
            match Self::remove_task_from_task(&mut current.child, target) {
                Some(task) => break task,
                None => {
                    current = current
                        .after
                        .as_mut()
                        .expect("should not reach invalid state");
                    continue;
                }
            }
        }
    }

    fn remove_column(board: &mut Self, target: Id) -> Column {
        let mut current = board.child.take().expect("should not reach invalid state");
        let before = &mut board.child;
        loop {
            if current.id == target {
                let after = current.after.take();
                match before {
                    Some(existing) => existing.after = after,
                    None => *before = after,
                }
                break *current;
            } else {
                *before = Some(current);
                current = before
                    .as_mut()
                    .expect("just set to some")
                    .after
                    .take()
                    .expect("should not reach invalid state");
            }
        }
    }
}

#[cfg(test)]
mod test {
    use crate::{board::Task, id::IdGen};

    use super::{Board, Column};

    fn wrap_ptr<T>(value: T) -> Option<Box<T>> {
        Some(Box::new(value))
    }

    #[test]
    fn add_remove_task() {
        let mut id_gen = IdGen::new();
        let mut board = Board::new(id_gen.gen(), "test".to_string());
        let task = id_gen.gen();
        let start = Column {
            id: id_gen.gen(),
            title: "start".to_string(),
            child: wrap_ptr(Task {
                id: id_gen.gen(),
                content: "first".to_string(),
                child: None,
                after: wrap_ptr(Task {
                    id: task,
                    content: "second".to_string(),
                    child: None,
                    after: wrap_ptr(Task {
                        id: id_gen.gen(),
                        child: None,
                        content: "third".to_string(),
                        after: wrap_ptr(Task {
                            id: id_gen.gen(),
                            child: None,
                            content: "fourth".to_string(),
                            after: None,
                        }),
                    }),
                }),
            }),
            after: None,
        };

        Board::add_column_to_board_last_child(&mut board, start);

        let removed = Board::remove_task(&mut board, task);
        assert_eq!(removed.id, task);

        dbg!(&board);
    }

    #[test]
    fn add_remove_start() {
        let mut id_gen = IdGen::new();
        let mut board = Board::new(id_gen.gen(), "test".to_string());
        let start_id = id_gen.gen();
        let start = Column {
            id: start_id,
            title: "start".to_string(),
            child: None,
            after: None,
        };

        let middle_id = id_gen.gen();
        let middle = Column {
            id: middle_id,
            title: "middle".to_string(),
            child: None,
            after: None,
        };

        let end_id = id_gen.gen();
        let end = Column {
            id: end_id,
            title: "end".to_string(),
            child: None,
            after: None,
        };
        Board::add_column_to_board_last_child(&mut board, start);
        Board::add_column_to_board_last_child(&mut board, middle);
        Board::add_column_to_board_last_child(&mut board, end);

        let removed = Board::remove_column(&mut board, start_id);
        assert_eq!(removed.title, "start".to_string());
        assert_eq!(removed.id, start_id);

        dbg!(board);
    }

    #[test]
    fn add_remove_middle() {
        let mut id_gen = IdGen::new();
        let mut board = Board::new(id_gen.gen(), "test".to_string());
        let start_id = id_gen.gen();
        let start = Column {
            id: start_id,
            title: "start".to_string(),
            child: None,
            after: None,
        };

        let middle_id = id_gen.gen();
        let middle = Column {
            id: middle_id,
            title: "middle".to_string(),
            child: None,
            after: None,
        };

        let end_id = id_gen.gen();
        let end = Column {
            id: end_id,
            title: "end".to_string(),
            child: None,
            after: None,
        };
        Board::add_column_to_board_last_child(&mut board, start);
        Board::add_column_to_board_last_child(&mut board, middle);
        Board::add_column_to_board_last_child(&mut board, end);

        let removed = Board::remove_column(&mut board, middle_id);
        assert_eq!(removed.title, "middle".to_string());
        assert_eq!(removed.id, middle_id);

        dbg!(board);
    }
}
