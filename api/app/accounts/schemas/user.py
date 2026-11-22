from pydantic import BaseModel, ConfigDict


class CenterSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    name: str


class MembershipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    role_label: str
    center: CenterSummary


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    first_name: str
    last_name: str
    full_name: str
    title: str
    university: str
    bio: str
    health_registry: str
    memberships: list[MembershipOut]
