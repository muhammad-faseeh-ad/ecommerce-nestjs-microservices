import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Role } from 'shared/enums/role.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsEnum(Role)
  roles: Role[];
}
