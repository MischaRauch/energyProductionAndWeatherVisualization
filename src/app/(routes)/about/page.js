import Image from 'next/image';
import '../../../../src/output.css';
import team_data from '@/data/team_data.json'

export default function About(){
    const renderTeam = () => {
        return team_data.data.map((member, index) => (
            <div key={index} className="w-33 px-8 py-2 flex flex-col items-center">
                <img className="mb-4" src={member.image} alt={member.name}/>
                <p className='text-line-height mb-2 text-uppercase font-bold font-blue'>{member.name}</p>
                {member.roles.map((role, roleIndex) => (
                    <p className="text-sm" key={roleIndex}>{role}</p>
                ))}
                <a href={member.linkedin}>LinkedIn</a>
            </div>
        ));
      };
    
    return(
        <div className='relative'>
            <div className="w-full py-12 flex items-center justify-center">
                <div className="max-w-screen-md flex flex-col items-center justify-center text-center">
                    <div className="flex flex-col items-center justify-center">
                        <h1> Meet the team </h1>
                    </div>
                    <div className="mt-4">
                        <div className="flex flex-wrap justify-center py-5">
                            {renderTeam()}
                        </div>
                    </div>
                </div>           
            </div>
            <img className='w-full' src="/assets/images/lineImg.svg" alt="line background"/>
            <div className='absolute bottom-0 flex w-full items-center justify-center'>
                <p>IVIS 2024</p>
            </div>
        </div>
    )
}