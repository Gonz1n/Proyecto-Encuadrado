from pydantic import BaseModel, EmailStr

from app.accounts.schemas.user import UserOut


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class LoginOut(BaseModel):
    token: str
    user: UserOut
