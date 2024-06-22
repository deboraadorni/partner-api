import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, SpotStatus, TicketStatus } from '@prisma/client';
import { ReserveSpotDto } from 'src/spots/dto/reserve-spot.dto';

@Injectable()
export class EventsService {

  constructor(private prismaService: PrismaService) { }

  create(createEventDto: CreateEventDto) {
    return this.prismaService.event.create({
      data: {
        ...createEventDto,
        date: new Date(createEventDto.date),
      }
    });
  }

  findAll() {
    return this.prismaService.event.findMany();
  }

  findOne(id: string) {
    return this.prismaService.event.findUnique({ where: { id } });
  }

  update(id: string, updateEventDto: UpdateEventDto) {
    const updateData = { ...updateEventDto };
    if (updateEventDto.date) {
      updateData.date = new Date(updateEventDto.date).toISOString();
    }

    return this.prismaService.event.update({
      where: { id },
      data: updateData
    });
  }

  remove(id: string) {
    return this.prismaService.event.delete({ where: { id } });
  }

  async reserveSpot(reserveSpotDto: ReserveSpotDto & { eventId: string }) {
    const spots = await this.prismaService.spot.findMany({ 
      where: { 
        eventId: reserveSpotDto.eventId,
        name: { in: reserveSpotDto.spots} }
    });
    if (spots.length !== reserveSpotDto.spots.length) {
      const foundSpotsName = spots.map(spot => spot.name);
      const notFoundSpotsName = reserveSpotDto.spots.filter(spot => !foundSpotsName.includes(spot));
      throw new HttpException(`Spots not found: ${notFoundSpotsName.join(', ')}`, HttpStatus.NOT_FOUND);
    }

    try {
      const tickets = this.prismaService.$transaction(async (prisma) => { 

        await prisma.reservationHistory.createMany({ 
          data: spots.map(spot => ({ spotId: spot.id, ticketKind: reserveSpotDto.ticketKind, email: reserveSpotDto.email, status: TicketStatus.RESERVED}))
         });
    
        await prisma.spot.updateMany({  
          where: { id: { in: spots.map(spot => spot.id) } },
          data: { status: SpotStatus.RESERVED }
        });
    
        const tickets = await Promise.all(spots.map(async spot => 
          await prisma.ticket.create({data: { 
          spotId: spot.id,
          ticketKind: reserveSpotDto.ticketKind,
          email: reserveSpotDto.email
        } }))).catch(error => { 
          console.log(error);
          const spotsName = spots.map(spot => spot.name);
          throw new HttpException(`Spots are already reserved: ${spotsName.join(', ')}`, HttpStatus.BAD_REQUEST);
        });
  
        return tickets;
      }, {isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted});
  
    return tickets;
    
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002':
          case 'P2034':
            throw new HttpException('One or more spots are already reserved', HttpStatus.BAD_REQUEST);
          default:
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
      }
    }
  }
}
