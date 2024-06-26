import { Link } from "react-router-dom";
import Button from "../components/common/Button"
import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from "react";
import Navbar from "../components/common/Navbar";
import AreaMetric from "../components/AreaMetric";
import ICAImage from "./../assets/ICA.png"
import { useModal } from "../context/ModalContext";
import DashboardTabs from "../components/DashboardTabs";

const data = [
  {
    "Actual Age": 1,
    "Developmental Age": 1,
  },
  {
    "Actual Age": 2,
    "Developmental Age": 1.5,
  },
  {
    "Actual Age": 3,
    "Developmental Age": 1.5,
  },
  {
    "Actual Age": 4,
    "Developmental Age": 1.65,
  },
  {
    "Actual Age": 5,
    "Developmental Age": 2.5,
  },
  {
    "Actual Age": 6,
    "Developmental Age": 4,
  },
  {
    "Actual Age": 7,
    "Developmental Age": 5,
  },
  {
    "Actual Age": 8,
    "Developmental Age": 6,
  },
  {
    "Actual Age": 9,
    "Developmental Age": 8,
  },
  {
    "Actual Age": 10,
    "Developmental Age": 9,
  },
  {
    "Actual Age": 11,
    "Developmental Age": 10.5,
  },
  {
    "Actual Age": 12,
    "Developmental Age": 11.5,
  },
];

function DashboardPage() {
  const auth = useAuth();
  const [dob, setDob] = useState("");
  const modal = useModal();

  const gap = "gap-4";

  const [ageResults, setAgeResult] = useState([]);
  const [evaluationStatus, setEvaluationStatus] = useState(false);
  const [physicalResult, setPhysicalResult] = useState(0);
  const [developmentalAge, setDevelopmentalAge] = useState(0);
  const [months, setMonths] = useState(0);
  const [user, setUser] = useState("");

  const [category, setCategory] = useState("");
  const [range, setRange] = useState("");

  function getStatus(evaluationStatus: Boolean): string {
    let status = evaluationStatus ? ("Complete") : ("Pending...")
    return status
  }

  async function getUser() {
    let response = await auth?.APIFunctions.GetRequest("/user/me", true);
    if (response.status == 200) {
      setDob(response?.data?.dob);
      setUser(response?.data?._id);
    }
  }

  useEffect(() => {
    getUser();
  }, [])

  useEffect(() => {
    if (!user) return;
    calculateMonths(dob);
    getphysicalResult();
    getAgeResult();
  }, [user])

  useEffect(() => {
    if (!ageResults) return;
    //check if ageResults is an Array
    if (!Array.isArray(ageResults)) return;
    setDevelopmentalAge(evaluateResults(months, ageResults));
  }, [ageResults])

  useEffect(() => {
    if (!months) return;
    getEvaluationStatus();
  }, [months])

  useEffect(() => {
    if (!developmentalAge) return;
    setCategory(getCategory());
  }, [developmentalAge])

  async function getAgeResult() {
    let months = calculateMonths(dob);
    let range = getMonthRange(months);
    let response = await auth?.APIFunctions.GetRequest("/scale/result/" + range, true, { user });
    setMonths(months);
    setRange(range);
    if (response.status == 200) {
      setAgeResult(response?.data);
    }
  }

  interface MinAge {
    [minAge: string]: number;
  }
  const minAge: MinAge = {
    'birth_to_five': 0,
    'six_to_ten': 6,
    'eleven_to_fifteen': 11,
    'sixteen_to_twenty': 16,
    'twentyone_to_twentyfive': 21,
    'twentysix_to_thirty': 26,
    'thirtyone_to_thirtyfive': 31,
    'thirtysix_to_forty': 36,
    'fortyone_to_fiftynine': 41,
    'sixty_to_seventyone': 60
  };

  function getCategory(): string {
    if (months === developmentalAge) {
      return "Actual Age";
    } else {
      return "Younger Age";
    }
  }

  type Response = "yes" | "no";
  function evaluateResults(age: number, results: Response[]): number {
    const countYes = results.filter(result => result === "yes").length;
    const countNo = results.filter(result => result === "no").length;

    const totalResponses = results.length;
    const halfResponses = totalResponses / 2;

    if (countYes === totalResponses - 1 && countNo === 1) {
      // All but one response is "yes"
      return age;
    } else if (countYes >= halfResponses) {
      // Half or more responses are "yes"
      return minAge[range] + 2;
    } else {
      // More than half responses are "no"
      return minAge[range];
    }
  }

  async function getphysicalResult() {
    let response = await auth?.APIFunctions.GetRequest("/physicaltime", true, { user });
    if (response.status == 200) {
      setPhysicalResult(response?.data?.results.physicalResult);
    }
  }

  async function getEvaluationStatus() {
    if ((months / 12) <= 6) {

      let range = getMonthRange(months);
      let response = await auth?.APIFunctions.GetRequest("/scale/result/" + range, true, { user });
      if (response?.data) {
        setEvaluationStatus(true);
      }
    }
    else {
      let response = await auth?.APIFunctions.GetRequest("/physicaltime", true, { user });
      if (response?.data) {
        setEvaluationStatus(true);
      }
    }
  }

  interface MonthRange {
    [months: number]: string;
  }
  function getMonthRange(months: number): string {
    const monthsRange: MonthRange = {
      0: 'birth_to_five',
      6: 'six_to_ten',
      11: 'eleven_to_fifteen',
      16: 'sixteen_to_twenty',
      21: 'twentyone_to_twentyfive',
      26: 'twentysix_to_thirty',
      31: 'thirtyone_to_thirtyfive',
      36: 'thirtysix_to_forty',
      41: 'fortyone_to_fiftynine',
      60: 'sixty_to_seventyone'
    };

    let monthRange = '';
    for (const rangeStart in monthsRange) {
      if (months >= parseInt(rangeStart)) {
        monthRange = monthsRange[rangeStart];
      } else {
        break;
      }
    }

    return monthRange;
  }


  function calculateMonths(dob: string) {
    const dateRegex: RegExp = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match: RegExpMatchArray | null = dob.match(dateRegex);

    if (!match) {
      throw new Error('Invalid date format. Please provide date in the format YYYY-MM-DD.');
    }

    const [, yearStr, monthStr, dayStr]: string[] = match;
    const day: number = parseInt(dayStr, 10);
    const month: number = parseInt(monthStr, 10);
    const year: number = parseInt(yearStr, 10);

    const today: Date = new Date();
    const birthDate: Date = new Date(year, month - 1, day); // month is 0-indexed in JavaScript Dates

    // Calculate the difference in months
    let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());

    // If the current day of the month is before the birth day, decrement months by 1
    if (today.getDate() < birthDate.getDate()) {
      months--;
    }

    setMonths(months);
    return months;
  }
  return (
    <>
      <Navbar />
      <section className="container mx-auto px-2 md:px-8 pb-24">
        <div className={`flex flex-col lg:flex-row ${gap}`}>
          <div className={`w-full h-96 lg:w-96 flex flex-col ${gap}`}>
            <div className="card p-4 flex flex-col gap-2">
              <div className="flex gap-4">
                <div className="h-24 w-24 overflow-clip rounded-lg">
                  <img
                    className="h-full w-full object-cover"
                    src="https://i.pinimg.com/originals/97/2f/1b/972f1b8aca65479e3c401b800a4bd76a.jpg"
                    alt=""
                  />
                </div>
                <div className="grow flex flex-col justify-center">
                  <h1 className="text-xl font-bold">{auth?.userdata?.name}</h1>
                  <h1 className="text-primary">{auth?.userdata?.email}</h1>
                </div>
                <div className="grid place-items-center">
                  <svg
                    className="duration-150 hover:text-error cursor-pointer hover:scale-110 active:scale-95"
                    onClick={async () => {
                      if (
                        await modal?.CreateModal(
                          "Sign Out",
                          <h1>Are you sure you want to Sign Out?</h1>,
                          "Yes",
                          "No"
                        )
                      )
                        auth?.APIFunctions.SignOut();
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M15.2958 9V5.25C15.2958 4.65326 15.0658 4.08097 14.6563 3.65901C14.2468 3.23705 13.6914 3 13.1124 3H7.28988C6.7108 3 6.15543 3.23705 5.74596 3.65901C5.33648 4.08097 5.10645 4.65326 5.10645 5.25V18.75C5.10645 19.3467 5.33648 19.919 5.74596 20.341C6.15543 20.7629 6.7108 21 7.28988 21H13.1124C13.6914 21 14.2468 20.7629 14.6563 20.341C15.0658 19.919 15.2958 19.3467 15.2958 18.75V15M11.6567 9L8.7455 12M8.7455 12L11.6567 15M8.7455 12H21.1183"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <Link className="w-full" to={"/results"}>
                <Button className="w-full" type="filled">
                  Results
                </Button>
              </Link>
            </div>
            <div className="grow card p-4 flex justify-between items-center">
              <h1 className="font-semibold text-md">Date of Birth</h1>
              <h1 className="font-semibold text-md text-primary">{dob}</h1>
            </div>
            <div className="grow card p-4 flex justify-between items-center">
              <h1 className="font-semibold text-md">Evaluation Status</h1>
              <div className="flex items-center"> {/* Wrap both text and SVG inside a container */}
                <h1 className="font-semibold text-md mx-2 text-primary">{getStatus(evaluationStatus)}</h1>
                {
                  evaluationStatus ? (
                    <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="green"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                  ):(null)
                }
              </div>
            </div>
          </div>
          <div className="card p-4 bg-white h-96 w-full lg:w-160 grow">
            <AreaMetric data={data} label="Age" sublabel=" Actual Age vs Developmental Age" />
          </div>
          <Link to='/analysis' className="card p-4 bg-white grow flex flex-col">
            <div className="flex justify-between gap-4">
              <h1 className="font-bold">Recent EEG Analysis</h1>
              <h1 className="text-primary flex items-center gap-2">
                <div className="text-sm">View Details</div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </h1>
            </div>
            <div className="grow flex justify-center items-center">
              <img className="w-64" src={ICAImage} alt="" />
            </div>
          </Link>
        </div>

        <DashboardTabs evaulationStatus={evaluationStatus} months={months} category={category} physicalResult={physicalResult}/>

        {/* <h1 className="text-2xl sm:text-4xl lg:text-6xl mt-12 font-semibold">
          <span className="gradient-text">Evaluation</span> Modules
        </h1>
        <div className="flex gap-4 flex-wrap text-light text-xl font-medium mt-8">
          {(months / 12) <= 6 ? (<>
            <Link className="card bg-primary w-96 grow hover:grow-[2] grid text-center py-16" to={"/evaluation/agescale"}>
              Developmental Age Scale
            </Link>
          </>) : (<>
            <Link className="card bg-primary w-96 grow hover:grow-[2] grid text-center py-16" to={"/evaluation/isaascale"}>
              IQ Test
            </Link>
            <Link className="card bg-primary w-96 grow hover:grow-[2] grid text-center py-16" to={"/evaluation/movementsequence"}>
              Physical Reaction Time
            </Link>
            <Link className="card bg-primary w-96 grow hover:grow-[2] grid text-center py-16" to={"/evaluation/isaascale"}>
              ISAA Scale
            </Link>
            <Link className="card bg-primary w-96 grow hover:grow-[2] grid text-center py-16" to={"/evaluation/movementsequence"}>
              Down Syndrome Test
            </Link>
          </>)}
        </div>
        {(evaluationStatus == true) ? (
          <>
            <h1 className="text-2xl sm:text-4xl lg:text-6xl mt-24 font-semibold">
              <span className="gradient-text">Training</span> Modules
            </h1>
            <h1 className="text-md sm:text-2xl lg:text-3xl opacity-70">
              Our Recommendations
            </h1>
            <div className="flex gap-4 flex-wrap text-light text-xl font-medium mt-8">
              {
                (months / 12) <= 6 ? (<>
                  {
                    category == "Younger" ? (<>
                      <Link className="card bg-primary w-96 grow hover:grow-[2] grid text-center py-16" to={"/training/3dtext"}>
                        3D Alphabets
                      </Link></>) : (<><Link className="card bg-primary w-96 grow hover:grow-[2] grid text-center py-16" to={"/training/colorMatch"}>
                        Color Matching
                      </Link>
                        <Link className="card bg-primary w-96 grow hover:grow-[2] grid text-center py-16" to={"/training/aquarium"}>
                          Sea-quence
                        </Link></>)
                  }
                </>
                ) : (
                  <>
                    {
                      (physicalResult < 7842) ? (<>
                        <Link className="card bg-primary w-96 grow hover:grow-[2] grid text-center py-16" to={"/training/colorMatch"}>
                          Color Matching
                        </Link>
                        <Link className="card bg-primary w-96 grow hover:grow-[2] grid text-center py-16" to={"/training/aquarium"}>
                          Sea-quence
                        </Link>
                        <Link className="card bg-primary w-96 grow hover:grow-[2] grid text-center py-16" to={"/training/detection"}>
                          Object Recognition
                        </Link></>) : (<> <Link className="card bg-primary w-96 grow hover:grow-[2] grid text-center py-16" to={"/training/crocodile"}>
                          Number Comparision
                        </Link>
                          <Link className="card bg-primary w-96 grow hover:grow-[2] grid text-center py-16" to={"/training/memoryGame"}>
                            Memory Game
                          </Link></>)
                    }
                  </>)
              }
            </div>
          </>
        ) : null} */}

      </section>
    </>
  )
}

export default DashboardPage