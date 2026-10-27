import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
	imports: [SharedModule],
	controllers: [OrganizationsController],
	providers: [OrganizationsService],
})
export class OrganizationsModule {}
