import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-newcommand',
  templateUrl: './newcommand.component.html',
  styleUrls: ['./newcommand.component.scss', '../../pdv.component.scss', '../../../../styles/modals.scss']
})
export class NewcommandComponent implements OnInit {
  name = ''

  faArrowLeft = faArrowLeft

  constructor(
    @Inject(MatDialogRef) private dialogRef,
    ) { }

  ngOnInit(): void {
  }

  public close(data: { createCommand: boolean }): void {
    this.dialogRef.close({ ...data, name: this.name })
  }
}
