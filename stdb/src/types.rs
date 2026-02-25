use spacetimedb::SpacetimeType;

#[derive(SpacetimeType, Clone, Copy, Debug, PartialEq, Eq)]
pub enum AgentRole {
    Zoe,
    Admin,
    Zeno,
}

impl AgentRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            AgentRole::Zoe => "zoe",
            AgentRole::Admin => "admin",
            AgentRole::Zeno => "zeno",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "zoe" => Some(AgentRole::Zoe),
            "admin" => Some(AgentRole::Admin),
            "zeno" => Some(AgentRole::Zeno),
            _ => None,
        }
    }
}

impl Default for AgentRole {
    fn default() -> Self {
        AgentRole::Zeno
    }
}

#[derive(SpacetimeType, Clone, Debug, PartialEq, Eq)]
pub enum TaskStatus {
    Open,
    Claimed,
    InProgress,
    Review,
    Completed,
    Blocked,
    Archived,
}

impl TaskStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            TaskStatus::Open => "open",
            TaskStatus::Claimed => "claimed",
            TaskStatus::InProgress => "in_progress",
            TaskStatus::Review => "review",
            TaskStatus::Completed => "completed",
            TaskStatus::Blocked => "blocked",
            TaskStatus::Archived => "archived",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "open" => Some(TaskStatus::Open),
            "claimed" => Some(TaskStatus::Claimed),
            "in_progress" => Some(TaskStatus::InProgress),
            "review" => Some(TaskStatus::Review),
            "completed" => Some(TaskStatus::Completed),
            "blocked" => Some(TaskStatus::Blocked),
            "archived" => Some(TaskStatus::Archived),
            _ => None,
        }
    }
}

impl Default for TaskStatus {
    fn default() -> Self {
        TaskStatus::Open
    }
}

#[derive(SpacetimeType, Clone, Debug, PartialEq, Eq)]
pub enum IdeaStatus {
    Voting,
    ApprovedForProject,
    Rejected,
    Implemented,
}

impl IdeaStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            IdeaStatus::Voting => "voting",
            IdeaStatus::ApprovedForProject => "approved_for_project",
            IdeaStatus::Rejected => "rejected",
            IdeaStatus::Implemented => "implemented",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "voting" => Some(IdeaStatus::Voting),
            "approved_for_project" => Some(IdeaStatus::ApprovedForProject),
            "rejected" => Some(IdeaStatus::Rejected),
            "implemented" => Some(IdeaStatus::Implemented),
            _ => None,
        }
    }
}

impl Default for IdeaStatus {
    fn default() -> Self {
        IdeaStatus::Voting
    }
}

#[derive(SpacetimeType, Clone, Debug, PartialEq, Eq)]
pub enum ProjectStatus {
    Active,
    Paused,
}

impl ProjectStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            ProjectStatus::Active => "active",
            ProjectStatus::Paused => "paused",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "active" => Some(ProjectStatus::Active),
            "paused" => Some(ProjectStatus::Paused),
            _ => None,
        }
    }
}

impl Default for ProjectStatus {
    fn default() -> Self {
        ProjectStatus::Active
    }
}

#[derive(SpacetimeType, Clone, Debug, PartialEq, Eq)]
pub enum VoteType {
    Up,
    Down,
    Veto,
}

impl VoteType {
    pub fn as_str(&self) -> &'static str {
        match self {
            VoteType::Up => "up",
            VoteType::Down => "down",
            VoteType::Veto => "veto",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "up" => Some(VoteType::Up),
            "down" => Some(VoteType::Down),
            "veto" => Some(VoteType::Veto),
            _ => None,
        }
    }
}

#[derive(SpacetimeType, Clone, Debug, PartialEq, Eq)]
pub enum AgentStatus {
    Online,
    Offline,
    Working,
}

impl AgentStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            AgentStatus::Online => "online",
            AgentStatus::Offline => "offline",
            AgentStatus::Working => "working",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "online" => Some(AgentStatus::Online),
            "offline" => Some(AgentStatus::Offline),
            "working" => Some(AgentStatus::Working),
            _ => None,
        }
    }
}

impl Default for AgentStatus {
    fn default() -> Self {
        AgentStatus::Offline
    }
}

#[derive(SpacetimeType, Clone, Debug, PartialEq, Eq)]
pub enum MessageType {
    User,
    System,
    Directive,
}

impl MessageType {
    pub fn as_str(&self) -> &'static str {
        match self {
            MessageType::User => "user",
            MessageType::System => "system",
            MessageType::Directive => "directive",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "user" => Some(MessageType::User),
            "system" => Some(MessageType::System),
            "directive" => Some(MessageType::Directive),
            _ => None,
        }
    }
}

#[derive(SpacetimeType, Clone, Debug, PartialEq, Eq)]
pub enum DependencyType {
    Blocks,
    ParentChild,
}

impl DependencyType {
    pub fn as_str(&self) -> &'static str {
        match self {
            DependencyType::Blocks => "blocks",
            DependencyType::ParentChild => "parent-child",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "blocks" => Some(DependencyType::Blocks),
            "parent-child" => Some(DependencyType::ParentChild),
            _ => None,
        }
    }
}

#[derive(SpacetimeType, Clone, Debug, PartialEq, Eq)]
pub enum DiscoveredTaskStatus {
    PendingReview,
    Approved,
    Rejected,
    EscalatedToIdea,
}

impl DiscoveredTaskStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            DiscoveredTaskStatus::PendingReview => "pending_review",
            DiscoveredTaskStatus::Approved => "approved",
            DiscoveredTaskStatus::Rejected => "rejected",
            DiscoveredTaskStatus::EscalatedToIdea => "escalated_to_idea",
        }
    }
}

#[derive(SpacetimeType, Clone, Debug, PartialEq, Eq)]
pub enum DiscoveryDecision {
    ApproveAsTask,
    Reject,
    EscalateToIdea,
}
