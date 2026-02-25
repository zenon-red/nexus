use spacetimedb::table;

#[table(accessor = config, public)]
pub struct Config {
    #[primary_key]
    pub key: String,
    pub value: String,
}
