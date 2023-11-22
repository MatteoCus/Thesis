import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ErrorModel, QualityphaseModel } from 'src/app/api/models';
import { QualityPhaseService } from 'src/app/api/services';
import { ActivePhaseService } from 'src/app/services/active-phase/active-phase.service';
import { AuthInformationsService } from 'src/app/services/auth-informations/auth-informations.service';
import { LogoutService } from 'src/app/services/logout/logout.service';

/**
 * Classe di gestione della visualizzazione delle fasi
 * Le fasi sono presentate come una lista di "carte" da scorrere (verticalmente o orizzontalmente, a seconda della modalità di visualizzazione)
 */
@Component({
  selector: 'app-phases',
  templateUrl: './phases.component.html',
  styleUrls: ['./phases.component.scss']
})
export class PhasesComponent implements OnInit {

  /**
   * Variabile booleana per gestire lo "skeleton loading" (il caricamento fittizio di dati)
   */
  public loading = true;

  /**
   * Fasi da visualizzare
   */
  public phases: Array<QualityphaseModel> = new Array<QualityphaseModel>();

  /**
   * Costruttore della classe di visualizzazione fasi, clicca automaticamente sulla prima fase disponibile
   * @param snackBar Barra di visualizzazione di messaggi di stato (ex. login fallito)
   * @param qualityPhaseService Servizio per l'ottenimento delle fasi
   * @param authInfoService Servizio per gestire le informazioni relative all'autenticazione
   * @param activePhaseService Servizio per gestire la fase attiva
   * @param logoutService Servizio di gestione del logout
   * @param translateService Servizio di gestione delle traduzioni: si basa su file json definiti in /assets/
   */
  constructor(private snackBar: MatSnackBar, private qualityPhaseService: QualityPhaseService, private authInfoService: AuthInformationsService, private activePhaseService: ActivePhaseService, private logoutService: LogoutService, private translateService: TranslateService) {
    // Osserva il rendering del primo pulsante: appena renderizzato, lo preme per far comparire gli attributi
    var observer = new MutationObserver(function () {
      if (document.getElementsByClassName('phase').item(0) != null) {
        let firstCard: HTMLElement = document.getElementsByClassName('phase')[0] as HTMLElement;
        firstCard.click();
        observer.disconnect();
      }
    });
    observer.observe(document, { attributes: false, childList: true, characterData: false, subtree: true })
  }

  /**
   * Inizializzazione delle fasi: chiamata API per ottenere le fasi
   */
  ngOnInit() {

    const token = this.authInfoService.Token;

    // Dichiarazioni dettate dai modelli in /app/api/models
    const start_plan = "start_plan" as 'c_phase_id' | 'm_product_category_id' | 'm_product_id' | 'status' | 'projectplan_timeline_id' | 'isglobal' | 'c_projectphase_id' | 'c_bpartner_id' | 'linename' | 'color' | 'start_plan' | 'phasename' | 'end_plan' | 'customer' | 'c_projectline_id' | 'ad_org_id' | 'ad_client_id';
    const end_plan = "end_plan" as 'c_phase_id' | 'm_product_category_id' | 'm_product_id' | 'status' | 'projectplan_timeline_id' | 'isglobal' | 'c_projectphase_id' | 'c_bpartner_id' | 'linename' | 'color' | 'start_plan' | 'phasename' | 'end_plan' | 'customer' | 'c_projectline_id' | 'ad_org_id' | 'ad_client_id';
    const status = "status" as 'c_phase_id' | 'm_product_category_id' | 'm_product_id' | 'status' | 'projectplan_timeline_id' | 'isglobal' | 'c_projectphase_id' | 'c_bpartner_id' | 'linename' | 'color' | 'start_plan' | 'phasename' | 'end_plan' | 'customer' | 'c_projectline_id' | 'ad_org_id' | 'ad_client_id';
    const start_plan_operator = "greaterOrEqual" as "equals" | "iNotContains" | "iContains" | "greaterOrEqual" | "lessOrEqual";
    const end_plan_operator = "lessOrEqual" as "equals" | "iNotContains" | "iContains" | "greaterOrEqual" | "lessOrEqual";
    const status_operator = "greaterOrEqual" as "equals" | "iNotContains" | "iContains" | "greaterOrEqual" | "lessOrEqual";
    const status_value = "I";

    // Condizioni di fetch:
    // -) start_plan_date: 30gg prima della data attuale
    // -) end_plan_date: 30gg dopo la data attuale
    // -) status_value: I, L (tutto tranne C)
    const previousMonth: number = (new Date().getMonth() - 1) % 12;
    const nextMonth: number = (new Date().getMonth() + 1) % 12;
    const previousYear: number = previousMonth == 11 ? new Date().getFullYear() - 1 : new Date().getFullYear();
    const nextYear: number = nextMonth == 0 ? new Date().getFullYear() + 1 : new Date().getFullYear();

    const start_plan_date: Date = new Date();
    const end_plan_date: Date = new Date();

    start_plan_date.setMonth(previousMonth);
    start_plan_date.setFullYear(previousYear);
    end_plan_date.setMonth(nextMonth);
    end_plan_date.setFullYear(nextYear);

    const params = {
      "AdesuiteToken": token,
      "body": {
        "startRow": 0,
        "criteria": [
          {
            "fieldName": start_plan as 'c_phase_id' | 'm_product_category_id' | 'm_product_id' | 'status' | 'projectplan_timeline_id' | 'isglobal' | 'c_projectphase_id' | 'c_bpartner_id' | 'linename' | 'color' | 'start_plan' | 'phasename' | 'end_plan' | 'customer' | 'c_projectline_id' | 'ad_org_id' | 'ad_client_id',
            "value": start_plan_date.toISOString().replace("T", " ").replace("Z", "").substring(0, 22),
            "operator": start_plan_operator as "equals" | "iNotContains" | "iContains" | "greaterOrEqual" | "lessOrEqual" | undefined
          },
          {
            "fieldName": end_plan as 'c_phase_id' | 'm_product_category_id' | 'm_product_id' | 'status' | 'projectplan_timeline_id' | 'isglobal' | 'c_projectphase_id' | 'c_bpartner_id' | 'linename' | 'color' | 'start_plan' | 'phasename' | 'end_plan' | 'customer' | 'c_projectline_id' | 'ad_org_id' | 'ad_client_id',
            "value": end_plan_date.toISOString().replace("T", " ").replace("Z", "").substring(0, 22),
            "operator": end_plan_operator as "equals" | "iNotContains" | "iContains" | "greaterOrEqual" | "lessOrEqual" | undefined
          },
          {
            "fieldName": status as 'c_phase_id' | 'm_product_category_id' | 'm_product_id' | 'status' | 'projectplan_timeline_id' | 'isglobal' | 'c_projectphase_id' | 'c_bpartner_id' | 'linename' | 'color' | 'start_plan' | 'phasename' | 'end_plan' | 'customer' | 'c_projectline_id' | 'ad_org_id' | 'ad_client_id',
            "value": status_value,
            "operator": status_operator as "equals" | "iNotContains" | "iContains" | "greaterOrEqual" | "lessOrEqual" | undefined
          }
        ],
        "orderby": [
          {
            "columnname": "end_plan" as 'c_phase_id' | 'm_product_category_id' | 'm_product_id' | 'status' | 'projectplan_timeline_id' | 'isglobal' | 'c_projectphase_id' | 'c_bpartner_id' | 'linename' | 'color' | 'start_plan' | 'phasename' | 'end_plan' | 'customer' | 'c_projectline_id' | 'ad_org_id' | 'ad_client_id',
            "direction": "ASC" as 'DESC' | 'ASC'
          }
        ],
        "endRow": 100
      }
    };

    this.qualityPhaseService.fetch_2(params)
      .subscribe({
        next: (response) => {
          (response.data != undefined && response.data != null && response.data.length != 0) ? this.phases = response.data : this.openSnackBar(this.translateService.instant("Errore: non ci sono fasi da visualizzare!"), "X");
        },
        error: (error) => {
          const errorDescription = (error.error as ErrorModel) != null ? (error.error as ErrorModel).description : (error.status == 401 ? "Non autorizzato" : "Errore lato server");
          this.openSnackBar(this.translateService.instant("Errore " + error.status + " - " + errorDescription), "X");
          if (error.status == 401) {
            this.logoutService.logout();
          }
          this.loading = false;
        },
        complete: () => { this.loading = false; }
      });

  }

  /**
   * Metodo per l'apertura della barra di visualizzazione di messaggi di stato
   * @param message Messaggio da mostrare
   * @param type Etichetta del pulsante di chiusura
  */
  private openSnackBar(message: string, type: string): void {
    this.snackBar.open(message, type, {
      panelClass: ['red-snackbar'],
    });
  }

  /**
   * Metodo che gestisce graficamente la selezione di una fase
   * @param id Identificativo dell'elemento HTML cliccato
   */
  public select(id: string): void {
    document.getElementsByClassName("selected-card")[0] ? document.getElementsByClassName("selected-card")[0].classList.remove("selected-card") : "";
    let activeElement = document.getElementById(id);
    if (activeElement != null && activeElement != undefined && activeElement?.textContent != null && activeElement?.textContent != "") {
      activeElement?.classList.add("selected-card");
    } else {
      this.openSnackBar(this.translateService.instant("La carta selezionata non contiene testo!"), "X");
    }
  }

  /**
   * Metodo per gestire la selezione (programmatica) di una fase
   * @param phase Nome della fase da impostare come attiva
   */
  public setActivePhase(phase: QualityphaseModel): void {
    this.activePhaseService.update(phase);
  }

}