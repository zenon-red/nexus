use spacetimedb::{Timestamp, table};

use crate::types::DependencyType;

#[table(
    accessor = task_dependencies,
    public,
    index(accessor = by_task_id, btree(columns = [task_id])),
    index(accessor = by_depends_on_id, btree(columns = [depends_on_id]))
)]
pub struct TaskDependency {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub task_id: u64,
    pub depends_on_id: u64,
    pub dependency_type: DependencyType,
    pub created_at: Timestamp,
}
