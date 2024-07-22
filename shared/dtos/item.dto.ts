import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class ItemDto{
    @IsNotEmpty()
    @IsString()
    productId: string;
    @IsNotEmpty()
    @IsNumber()
    quantity: number;
}