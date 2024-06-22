import { TicketKind } from "@prisma/client";
import { IsNotEmpty, IsEmail, IsArray, IsIn, IsString } from "class-validator";

export class ReserveSpotDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  spots: string[];


  @IsNotEmpty()
  @IsIn([TicketKind.FULL, TicketKind.HALF])
  ticketKind: TicketKind;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}