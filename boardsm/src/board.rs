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

pub fn new_board(id: Id, title: String) -> Board {
    Board {
        id,
        title,
        child: None,
    }
}

pub fn feed_action(board: &mut Board, id_gen: &mut IdGen, action: Action) {
    match action {
        Action::AddColumn { title } => add_column_to_board_last_child(
            board,
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
            let root = board.child.as_mut().expect("should exist idk");
            let column = column_from_id(root, dest);
            if let Some(column) = column {
                return add_task_to_column_last_child(column, src);
            }

            let task = task_from_id(root, dest);
            if let Some(task) = task {
                return add_task_to_task_last_child(task, src);
            }
        }
        Action::DeleteColumn { dest } => {
            remove_column(board, dest);
        }
        Action::DeleteTask { dest } => {
            remove_task(board, dest);
        }
        Action::MoveTask { src, dest } => {
            let src = remove_task(board, src);
            let root = board.child.as_mut().expect("should exist idk");
            match dest {
                TaskPosition::FirstChildOf(id) => {
                    let column = column_from_id(root, id);
                    if let Some(column) = column {
                        return add_task_to_column_first_child(column, src);
                    }

                    let task = task_from_id(root, id);
                    if let Some(task) = task {
                        return add_task_to_task_first_child(task, src);
                    }
                }
                TaskPosition::After(id) => {
                    let task = task_from_id(root, id);
                    if let Some(task) = task {
                        return add_task_after_task(task, src);
                    }
                }
            }
        }
        Action::MoveColumn { src, dest } => {
            let src = remove_column(board, src);
            match dest {
                ColumnPosition::FirstChild => {
                    add_column_to_board_first_child(board, src);
                }
                ColumnPosition::After(dest) => {
                    let root = board.child.as_mut().expect("should exist idk");
                    let dest = column_from_id(root, dest).expect("should exist idk");
                    add_column_after_column(dest, src);
                }
            }
        }
        Action::EditTask { dest, content } => {
            let root = board.child.as_mut().expect("should exist idk");
            let dest = task_from_id(root, dest).expect("should exist idk");
            dest.content = content;
        }
        Action::EditColumn { dest, title } => {
            let root = board.child.as_mut().expect("should exist idk");
            let dest = column_from_id(root, dest).expect("should exist idk");
            dest.title = title;
        }
        Action::EditBoard { title } => {
            board.title = title;
        }
    }
}

fn last_task_sibling(item: &mut Task) -> &mut Task {
    match item.after {
        Some(ref mut item) => last_task_sibling(item),
        None => item,
    }
}

fn last_column_sibling(item: &mut Column) -> &mut Column {
    match item.after {
        Some(ref mut item) => last_column_sibling(item),
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
        .and_then(|column| column_from_id(column, target))
}

fn task_from_id_and_task(task: &mut Task, target: Id) -> Option<&mut Task> {
    if task.id == target {
        return Some(task);
    }

    let child = task
        .child
        .as_mut()
        .and_then(|v| task_from_id_and_task(v, target));

    if let Some(child) = child {
        return Some(child);
    }

    task.after
        .as_mut()
        .and_then(|task| task_from_id_and_task(task, target))
}

fn task_from_id(column: &mut Column, target: Id) -> Option<&mut Task> {
    let child = column
        .child
        .as_mut()
        .and_then(|v| task_from_id_and_task(v, target));

    if let Some(child) = child {
        return Some(child);
    }

    column
        .after
        .as_mut()
        .and_then(|column| task_from_id(column, target))
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
        Some(ref mut child) => last_task_sibling(child).after = Some(Box::new(task)),
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
        Some(ref mut child) => last_task_sibling(child).after = Some(Box::new(task)),
        None => dest.child = Some(Box::new(task)),
    }
}

fn add_column_to_board_first_child(dest: &mut Board, mut column: Column) {
    match dest.child.take() {
        Some(child) => {
            column.after = Some(child);
            dest.child = Some(Box::new(column));
        }
        None => dest.child = Some(Box::new(column)),
    }
}

fn add_column_to_board_last_child(dest: &mut Board, column: Column) {
    match &mut dest.child {
        Some(child) => last_column_sibling(child).after = Some(Box::new(column)),
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

    if let Some(child) = remove_task_from_task(&mut task.child, target) {
        *position = Some(task);
        return Some(child);
    };
    if let Some(after) = remove_task_from_task(&mut task.after, target) {
        *position = Some(task);
        return Some(after);
    };
    *position = Some(task);

    None
}

fn remove_task(board: &mut Board, target: Id) -> Task {
    let mut current = board
        .child
        .as_mut()
        .expect("should not reach invalid state");
    loop {
        match remove_task_from_task(&mut current.child, target) {
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

fn remove_column(board: &mut Board, target: Id) -> Column {
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
