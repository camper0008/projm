use crate::id::Id;

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

enum Move {
    FirstChildOf(Id),
    After(Id),
}

impl Board {
    pub fn new(id: Id, title: String) -> Self {
        Self {
            id,
            title,
            child: None,
        }
    }

    pub fn last_task_sibling(item: &mut Task) -> &mut Task {
        match item.after {
            Some(ref mut item) => Self::last_task_sibling(item),
            None => item,
        }
    }

    pub fn last_column_sibling(item: &mut Column) -> &mut Column {
        match item.after {
            Some(ref mut item) => Self::last_column_sibling(item),
            None => item,
        }
    }

    pub fn add_task_to_column(dest: &mut Column, task: Ptr<Task>) {
        match dest.child {
            Some(ref mut child) => Self::last_task_sibling(child).after = task,
            None => dest.child = task,
        }
    }

    pub fn add_task_to_task(dest: &mut Task, task: Ptr<Task>) {
        match dest.child {
            Some(ref mut child) => Self::last_task_sibling(child).after = task,
            None => dest.child = task,
        }
    }

    pub fn add_column_to_board(dest: &mut Self, column: Ptr<Column>) {
        match &mut dest.child {
            Some(child) => Self::last_column_sibling(child).after = column,
            None => dest.child = column,
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

    pub fn remove_task(board: &mut Self, target: Id) -> Task {
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

    pub fn remove_column(board: &mut Self, target: Id) -> Column {
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

    pub fn move_column(dest: Move, src: Id) {}

    pub fn edit_board(dest: &mut Self, title: String) {
        dest.title = title;
    }

    pub fn edit_column(dest: &mut Column, title: String) {
        dest.title = title;
    }

    pub fn edit_task(dest: &mut Task, content: String) {
        dest.content = content;
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

        Board::add_column_to_board(&mut board, wrap_ptr(start));

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
        Board::add_column_to_board(&mut board, wrap_ptr(start));
        Board::add_column_to_board(&mut board, wrap_ptr(middle));
        Board::add_column_to_board(&mut board, wrap_ptr(end));

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
        Board::add_column_to_board(&mut board, wrap_ptr(start));
        Board::add_column_to_board(&mut board, wrap_ptr(middle));
        Board::add_column_to_board(&mut board, wrap_ptr(end));

        let removed = Board::remove_column(&mut board, middle_id);
        assert_eq!(removed.title, "middle".to_string());
        assert_eq!(removed.id, middle_id);

        dbg!(board);
    }
}
