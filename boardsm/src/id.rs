#[derive(Debug, PartialEq, Clone, Copy)]
pub struct Id(usize);

pub struct IdGen(usize);

impl IdGen {
    pub fn new() -> Self {
        Self(0)
    }

    pub fn gen(&mut self) -> Id {
        let id = Id(self.0);
        self.0 += 1;
        id
    }
}
