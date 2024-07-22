import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateProductDto{

    @IsNotEmpty()
    @IsString()
    readonly name: string;
    @IsString()
    @IsNotEmpty()
    readonly author: string;
    @IsNumber()
    @IsNotEmpty()
    readonly rating: number;
    @IsString()
    @IsNotEmpty()
    readonly category: string;
    @IsNumber()
    @IsNotEmpty()
    readonly stock:number;
}