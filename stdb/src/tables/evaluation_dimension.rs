use spacetimedb::table;

#[table(accessor = evaluation_dimensions, public, index(accessor = by_active, btree(columns = [active, sort_order])))]
pub struct EvaluationDimension {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub name: String,
    pub label: String,
    pub weight: f64,
    #[default(1)]
    pub min_score: u8,
    #[default(10)]
    pub max_score: u8,
    pub description: String,
    #[default(true)]
    pub active: bool,
    #[default(0)]
    pub sort_order: u16,
}
