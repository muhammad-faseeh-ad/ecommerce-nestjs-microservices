import { IsOptional, IsString } from "class-validator";

export class FilterProductDto{
    @IsOptional()
    @IsString()
    search: string;
    @IsString()
    @IsOptional()
    category: string;
}