import { IsString, IsNotEmpty, Length, IsInt, Min, IsISO8601 } from "class-validator";

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 255)
    name:        string

    @IsString()
    @IsNotEmpty()
    @Length(1, 255)
    description: string

    @IsString()
    @IsNotEmpty()
    @IsISO8601()
    date:        string

    @IsNotEmpty()
    @IsInt()
    @Min(0)
    price:       number

    @IsString()
    @IsNotEmpty()
    @Length(1, 255)
    location:    string
}


