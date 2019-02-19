import { sample } from 'lodash';

export default new class {
  public readonly WELCOME = 'welcome';
  public readonly WAIT_WHILE_FETCH = 'wait_while_fetch';
  public readonly NO_DOCS_FOUND = 'no_docs_found';
  public readonly NOT_UNDERSTOOD_USE_BUTTONS = 'NOT_UNDERSTOOD_USE_BUTTONS';
  public readonly USEFULLNESS_QUERY = 'USEFULLNESS_QUERY';
  public readonly MORE_QUESTIONS = 'more_questions';
  public readonly THANK_FEEDBACK = 'thank_feedback';
  public readonly REAL_PERSON = 'real_person';
  public readonly EMAIL_SENT = 'email_sent';
  public readonly POSITIVE = 'Ja';
  public readonly NEGATIVE = 'Nee';

  private options = {
    [this.WELCOME]: [
      `Hallo!
      Ik ben een bot, mij kan je verschillende vragen stellen over q-besluit in Gent.`,
      `Ik ben een bot die je vragen kan stellen over besluitvorming in Gent`,
    ],
    [this.WAIT_WHILE_FETCH]: [
      `Even geduld terwijl ik de juiste documenten zoek.`,
      'Ok, ik zal even gaan zoeken naar de juiste documenten.',
    ],
    [this.NO_DOCS_FOUND]: [
      `Helaas heb ik niets teruggevonden.`,
      'Hier heb ik geen enkel document over gevonden.',
      'Jammer genoeg vind ik niets terug.',
    ],
    [this.NOT_UNDERSTOOD_USE_BUTTONS]: [
      'Dat heb ik niet verstaan. Gelieve de knoppen te gebruiken.',
      'Wat?',
    ],
    [this.USEFULLNESS_QUERY]: [
      'Waren deze documenten nuttig?',
      'Wat vond je van deze documenten?',
    ],
    [this.REAL_PERSON]: [
      'Wil je dat ik een echte persoon haal?',
      'Als je wil kan ik er een echte persoon bij halen. Goed?',
    ],
    [this.EMAIL_SENT]: [
      'Ok, ik heb de vraag behandeld, er komt binnenkort iemand op terug.',
      'Ok, ik heb een mail verzonden. Binnekort word deze behandeld door een echte persoon.',
    ],
    [this.THANK_FEEDBACK]: [
      'Bedankt voor de feedback!',
      'Merci! Door deze feedback word ik alleen maar slimmer.',
    ],
    [this.MORE_QUESTIONS]: [
      'Heb je nog meer vragen? Wees niet bang om ze hier te stellen.',
      'Indien je nog vragen hebt, kan je ze hier stellen.',
    ],
    default: [],
  };

  // private get data() {
  //   return <any>data;
  // }

  getStringFor(key: string): string {
    return sample(this.options[key] || this.options.default);
  }
}();
