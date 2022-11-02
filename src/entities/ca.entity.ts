import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("t_certificates")
export class CA {
  @PrimaryGeneratedColumn("uuid")
  public id!: string;

  @Column({ type: "text" })
  public host!: string;

  @Column("text")
  public ca!: string;

  @Column("text")
  public pk!: string;

  @Column("text")
  public publicKey!: string;

  @CreateDateColumn()
  public createdAt!: Date;

  @UpdateDateColumn()
  public updatedAt!: Date;
}
