from pydantic import BaseModel


class MemberUserOut(BaseModel):
    full_name: str
    email: str
    title: str


class MemberOut(BaseModel):
    id: int
    role: str
    role_label: str
    user: MemberUserOut
