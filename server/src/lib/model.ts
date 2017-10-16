import Users from './model/users';
import { default as Clips, Clip } from './model/clips';

const MP3_EXT = '.mp3';
const TEXT_EXT = '.txt';
const VOTE_EXT = '.vote';
const JSON_EXT = '.json';

/**
 * The Model loads all clip and user data into memory for quick access.
 */
export default class Model {
  users: Users;
  clips: Clips;
  loaded: boolean;

  constructor() {
    this.users = new Users();
    this.clips = new Clips();
    this.loaded = false;
  }

  private addClip(userid: string, sentenceid: string, path: string) {
    this.users.addClip(userid, path);
    this.clips.addClip(userid, sentenceid, path);
  }

  private addVote(
    userid: string,
    sentenceid: string,
    voterid: string,
    path: string
  ) {
    this.users.addListen(voterid);
    this.clips.addVote(userid, sentenceid, path);
  }

  private addSentence(userid: string, sentenceid: string, path: string) {
    this.clips.addSentence(userid, sentenceid, path);
  }

  addSentenceContent(userid: string, sentenceid: string, text: string) {
    this.clips.addSentenceContent(userid, sentenceid, text);
  }

  private addDemographics(userid: string, path: string) {
    this.users.addDemographics(userid, path);
  }

  private print(...args: any[]) {
    args.unshift('MODEL --');
    console.log.apply(console, args);
  }

  printMetrics() {
    const userMetrics = this.users.getCurrentMetrics();
    let totalUsers = userMetrics.users;
    let listeners = userMetrics.listeners;
    let submitters = userMetrics.submitters;

    const clipMetrics = this.clips.getCurrentMetrics();
    let totalClips = clipMetrics.clips;
    let unverified = clipMetrics.unverified;
    let clipSubmitters = clipMetrics.submitters;
    let votes = clipMetrics.votes;

    this.print(totalUsers, ' total users');
    this.print((listeners / totalUsers).toFixed(2), '% users who listen');
    this.print((submitters / totalUsers).toFixed(2), '% users who submit\n');
    this.print(totalClips, ' total clips');
    this.print(votes, ' total votes');
    this.print(unverified, ' unverified clips');
    this.print(clipSubmitters, ' users with clips (', submitters, ')\n');
  }

  /**
   * This function extracts the metadata (userid, file type, etc)
   * from filePath, and updates appropriate sub models.
   */
  processFilePath(filePath: string) {
    const dotIndex = filePath.indexOf('.');

    // Filter out any directories.
    if (dotIndex === -1) {
      return;
    }

    // Glob is a path in the form $userid/$sentenceid.
    const glob = filePath.substr(0, dotIndex);
    const ext = filePath.substr(dotIndex);

    let userid, sentenceid;
    [userid, sentenceid] = glob.split('/');

    switch (ext) {
      case TEXT_EXT:
        this.addSentence(userid, sentenceid, filePath);
        break;

      case MP3_EXT:
        this.addClip(userid, sentenceid, filePath);
        break;

      case VOTE_EXT:
        let voterid;
        [sentenceid, voterid] = sentenceid.split('-by-');
        this.addVote(userid, sentenceid, voterid, filePath);
        break;

      case JSON_EXT:
        if (sentenceid !== 'demographic') {
          console.error('unknown json file found', filePath);
          return;
        }
        this.addDemographics(userid, filePath);
        break;

      default:
        console.error('unrecognized file', filePath, ext, dotIndex);
        break;
    }
  }

  /**
   * Fetch a random clip but make sure it's not the user's.
   */
  getEllibleClip(userid: string): Clip {
    return this.clips.getEllibleClip(userid);
  }

  /**
   * Signals that all the files have been added.
   */
  setLoaded() {
    this.users.setLoaded();
    this.clips.setLoaded();
    this.loaded = true;
  }
}
