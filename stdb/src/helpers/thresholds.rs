pub fn calculate_thresholds(active_count: u32) -> (u16, u16, u16) {
    let quorum = ((active_count as f64 * 0.33).ceil() as u16).max(5);
    let approval = ((quorum as f64 * 0.50).ceil() as u16).max(5);
    let veto = ((quorum as f64 * 0.33).ceil() as u16).max(3);
    (quorum, approval, veto)
}
